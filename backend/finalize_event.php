<?php
/**
 * backend/finalize_event.php
 * Sets logistics and publishes the event (CURRENT_STATUS → 'published') in event_master.
 */

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$event_id              = $_POST['event_id']              ?? null;
$event_date            = $_POST['event_date']            ?? null;
$event_time            = $_POST['event_time']            ?? null;
$venue                 = $_POST['venue']                 ?? null;
$registration_deadline = $_POST['registration_deadline'] ?? null;
$sub_events_logistics  = $_POST['sub_events_logistics']  ?? null;

// Capacity limits are set during event proposal and should not be overwritten here

if (!$event_id) {
    echo json_encode(['success' => false, 'message' => 'Event ID is required.']);
    exit;
}

$dq = $conn->prepare("SELECT ATTACHMENTS FROM event_master WHERE EVENT_ID = ?");
$dq->bind_param("s", $event_id);
$dq->execute();
$details_row = $dq->get_result()->fetch_assoc();
$dq->close();

$details = [];
if (!empty($details_row['ATTACHMENTS'])) {
    $details = json_decode($details_row['ATTACHMENTS'], true);
}
if ($sub_events_logistics) {
    $details['sub_events_logistics'] = json_decode($sub_events_logistics, true);
}
$details_json = json_encode($details);

// Update event_master
$stmt = $conn->prepare("
    UPDATE event_master
    SET START_DATE            = ?,
        END_DATE              = ?,
        START_TIME            = ?,
        VENUE                 = ?,
        REGISTRATION_DEADLINE = ?,
        ATTACHMENTS           = ?,
        CURRENT_STATUS        = 'published'
    WHERE EVENT_ID = ?
");
$end_date = $event_date; // single-day event: end = start
$stmt->bind_param("sssssss",
    $event_date, $end_date, $event_time, $venue, $registration_deadline, $details_json,
    $event_id
);

if ($stmt->execute()) {
    // Fetch event details for student notifications
    $eq = $conn->prepare("SELECT em.EVENT_TITLE AS event_title, em.SCALE AS event_scale, u.DEPT AS proposer_dept, u.USERNAME AS proposer_uid FROM event_master em LEFT JOIN users u ON em.PROPOSER_ID = u.USERNAME WHERE em.EVENT_ID = ?");
    $eq->bind_param("s", $event_id);
    $eq->execute();
    $event = $eq->get_result()->fetch_assoc();
    $eq->close();

    if ($event) {
        $deadline_text = $registration_deadline ? " Register by " . date('d M h:i A', strtotime($registration_deadline)) . "." : "";
        $student_msg   = "🎉 New event published: {$event['event_title']}. Check it out!$deadline_text";

        $student_sql = "SELECT USERNAME FROM users WHERE ROLE = 'student'";
        if ($event['event_scale'] === 'department' && !empty($event['proposer_dept'])) {
            $dept_esc = $conn->real_escape_string($event['proposer_dept']);
            $student_sql .= " AND DEPT = '$dept_esc'";
        }
        $get_students = $conn->prepare($student_sql);
        $get_students->execute();
        $student_res = $get_students->get_result();
        $get_students->close();

        if ($student_res) {
            $insert_notif = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
            if ($insert_notif) {
                while ($student = $student_res->fetch_assoc()) {
                    if ($student['USERNAME'] !== $event['proposer_uid']) {
                        $uid = $student['USERNAME'];
                        $insert_notif->bind_param('ss', $uid, $student_msg);
                        $insert_notif->execute();
                    }
                }
                $insert_notif->close();
            }
        }
    }

    echo json_encode(['success' => true, 'message' => "Logistics updated and event published!"]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database update failed: ' . $conn->error]);
}

$stmt->close(); $conn->close();
?>
