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

// Fetch existing DETAILS_JSON from event_metadata
$dq = $conn->prepare("SELECT DETAILS_JSON FROM event_metadata WHERE EVENT_ID = ?");
$dq->bind_param("i", $event_id);
$dq->execute();
$details_row = $dq->get_result()->fetch_assoc();
$dq->close();

$details = [];
if (!empty($details_row['DETAILS_JSON'])) {
    $details = json_decode($details_row['DETAILS_JSON'], true);
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
        CURRENT_STATUS        = 'published'
    WHERE SL_NO = ?
");
$end_date = $event_date; // single-day event: end = start
$stmt->bind_param("ssssi",
    $event_date, $end_date, $event_time, $venue,
    $event_id
);

$meta_stmt = $conn->prepare("
    UPDATE event_metadata
    SET REGISTRATION_DEADLINE = ?,
        DETAILS_JSON          = ?
    WHERE EVENT_ID = ?
");
$meta_stmt->bind_param("ssi",
    $registration_deadline, $details_json, $event_id
);

if ($stmt->execute() && $meta_stmt->execute()) {
    $meta_stmt->close();
    // Fetch event details for student notifications
    $eq = $conn->prepare("SELECT em.EVENT AS event_title, em.EVENT_SCALE AS event_scale, u.department AS proposer_dept, u.usn_or_emp_id AS proposer_uid FROM event_master em LEFT JOIN users u ON em.CREATED_BY = u.id WHERE em.SL_NO = ?");
    $eq->bind_param("i", $event_id);
    $eq->execute();
    $event = $eq->get_result()->fetch_assoc();
    $eq->close();

    if ($event) {
        $deadline_text = $registration_deadline ? " Register by " . date('d M h:i A', strtotime($registration_deadline)) . "." : "";
        $student_msg   = "🎉 New event published: {$event['event_title']}. Check it out!$deadline_text";

        $student_sql = "SELECT usn_or_emp_id FROM users WHERE system_role = 'student'";
        if ($event['event_scale'] === 'department' && !empty($event['proposer_dept'])) {
            $dept_esc = $conn->real_escape_string($event['proposer_dept']);
            $student_sql .= " AND department = '$dept_esc'";
        }
        $get_students = $conn->prepare($student_sql);
        $get_students->execute();
        $student_res = $get_students->get_result();
        $get_students->close();

        if ($student_res) {
            $insert_notif = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
            if ($insert_notif) {
                while ($student = $student_res->fetch_assoc()) {
                    if ($student['usn_or_emp_id'] !== $event['proposer_uid']) {
                        $uid = $student['usn_or_emp_id'];
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
