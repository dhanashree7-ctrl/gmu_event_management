<?php
/**
 * backend/register_for_event.php
 * Handles student registration. Fetches event blueprint from event_master,
 * inserts a lean transaction record into event_registrations.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

$input = file_get_contents('php://input');
$body  = json_decode($input, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$event_id   = $body['event_id'] ?? null;
$student_id = trim((string)($body['student_id'] ?? ''));

$allowed_roles = ['participant', 'volunteer', 'coordinator'];
$reg_role = strtolower(trim((string)($body['role'] ?? 'participant')));
if (!in_array($reg_role, $allowed_roles, true)) $reg_role = 'participant';

$special_requirements = trim((string)($body['special_requirements'] ?? ''));
$selected_sub_events  = $body['selected_sub_events'] ?? [];

$is_team_lead = isset($body['is_team_lead']) ? (bool)$body['is_team_lead'] : false;
$team_lead_name = $is_team_lead ? $student_id : trim((string)($body['team_lead'] ?? ''));
$team_members_arr = is_array($body['team_members'] ?? null) ? $body['team_members'] : [];

if (!$event_id || $student_id === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'event_id and student_id are required.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// ── Fetch event from event_master ──────────────────────────────────────────────
$event_stmt = $conn->prepare("
    SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.DESCRIPTION AS description,
           em.START_DATE AS event_date, em.REGISTRATION_DEADLINE AS registration_deadline,
           em.MAX_PARTICIPANTS AS max_participants, em.CURRENT_STATUS AS current_status,
           em.MAX_MEMBERS AS max_team_size
    FROM event_master em 
    WHERE em.EVENT_ID = ? AND em.CURRENT_STATUS IN ('published', 'approved')
");
$event_stmt->bind_param('s', $event_id);
$event_stmt->execute();
$event_data = $event_stmt->get_result()->fetch_assoc();
$event_stmt->close();

if (!$event_data) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Event not found or not published.']);
    $conn->close();
    exit;
}

// ── Registration deadline / date check ────────────────────────────────────────
if ($event_data['registration_deadline']) {
    $now      = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
    $deadline = new DateTime($event_data['registration_deadline'], new DateTimeZone('Asia/Kolkata'));
    if ($now > $deadline) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Registration is closed. The deadline has passed.']);
        $conn->close(); exit;
    }
} elseif ($event_data['event_date']) {
    $now   = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
    $today = $now->format('Y-m-d');
    if ($today >= $event_data['event_date']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Registration is closed. You cannot register on or after the event day.']);
        $conn->close(); exit;
    }
}

// ── Capacity check ────────────────────────────────────────────────────────────
$max_for_role = $reg_role === 'participant' ? $event_data['max_participants'] : null;
if ($max_for_role !== null) {
    $cap_stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM event_registrations WHERE EVENT_ID = ? AND ROLE = ?");
    $cap_stmt->bind_param('ss', $event_id, $reg_role);
    $cap_stmt->execute();
    $cap_row = $cap_stmt->get_result()->fetch_assoc();
    $cap_stmt->close();
    if ((int)$cap_row['cnt'] >= (int)$max_for_role) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Sorry, the $reg_role slots are full for this event."]);
        $conn->close(); exit;
    }
}

// ── Fetch student details ──────────────────────────────────────────────────────
$stu_stmt = $conn->prepare("SELECT USERNAME FROM users WHERE USERNAME = ? OR ID = ? LIMIT 1");
$stu_stmt->bind_param('ss', $student_id, $student_id);
$stu_stmt->execute();
$stu_row = $stu_stmt->get_result()->fetch_assoc();
$stu_stmt->close();
$student_usn = $stu_row['USERNAME'] ?? $student_id;

// ── Generate QR token ─────────────────────────────────────────────────────────
$qr_token = 'EVT-' . $event_id . '-STU-' . $student_id . '-' . uniqid();

$team_members_str = null;
if ($reg_role === 'participant') {
    $max_size = $event_data['max_team_size'] ?? 1;
    if ($max_size > 1 && count($team_members_arr) > ($max_size - 1)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Maximum team size is $max_size (including the lead)."]);
        $conn->close(); exit;
    }
    if (!empty($team_members_arr)) {
        $team_members_str = implode(', ', $team_members_arr);
    }
}

$details_data = [];
if (!empty($selected_sub_events)) $details_data['registered_sub_events'] = $selected_sub_events;
if (!empty($special_requirements)) $details_data['special_requirements'] = $special_requirements;
$details_json = !empty($details_data) ? json_encode($details_data) : null;

// ── Insert lean transaction into event_registrations ──────────────────────────
$reg_stmt = $conn->prepare("
    INSERT INTO event_registrations (
        USER_ID, EVENT_ID, ROLE, STATUS, REGISTRATION_DATE,
        QR_CODE, CHECK_IN_STATUS, EXTERNAL_DETAILS,
        TEAM_LEAD, TEAM_MEMBERS
    ) VALUES (
        ?, ?, ?, 'active', NOW(),
        ?, 'pending', ?,
        ?, ?
    )
");
if (!$reg_stmt) {
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error (prepare).']);
    exit;
}

$reg_stmt->bind_param('sssssss',
    $student_usn, $event_id, $reg_role,
    $qr_token, $details_json,
    $team_lead_name, $team_members_str
);

try {
    $reg_stmt->execute();
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'You are already registered for this event.']);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit;
}
$reg_stmt->close();

// ── Notification to student ───────────────────────────────────────────────────
$role_label = ucfirst($reg_role);
$notif_stmt = $conn->prepare("INSERT INTO notifications (USER_ID, MESSAGE, TARGET_LINK) VALUES (?, ?, '/student-dashboard')");
if ($notif_stmt) {
    $msg = "Registration confirmed as $role_label for '{$event_data['event_title']}'! Check your tickets. 🎟️";
    $notif_stmt->bind_param('ss', $student_id, $msg);
    $notif_stmt->execute();
    $notif_stmt->close();
}

// ── Milestone notification for proposer ──────────────────────────────────────
$count_stmt = $conn->prepare("SELECT COUNT(*) AS total_reg FROM event_registrations WHERE EVENT_ID = ?");
if ($count_stmt) {
    $count_stmt->bind_param('i', $event_id);
    $count_stmt->execute();
    $count_row = $count_stmt->get_result()->fetch_assoc();
    $count_stmt->close();
    $total_reg = (int)$count_row['total_reg'];
    if (in_array($total_reg, [1, 25, 50, 100, 200])) {
        $evt_stmt = $conn->prepare("SELECT em.EVENT AS event_title, u.usn_or_emp_id AS proposer_id FROM event_master em JOIN users u ON em.CREATED_BY = u.id WHERE em.SL_NO = ?");
        if ($evt_stmt) {
            $evt_stmt->bind_param('i', $event_id);
            $evt_stmt->execute();
            if ($evt_row = $evt_stmt->get_result()->fetch_assoc()) {
                $msg     = "🎉 Milestone! $total_reg students registered for '{$evt_row['event_title']}'.";
                $m_notif = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/faculty-dashboard')");
                if ($m_notif) {
                    $m_notif->bind_param('ss', $evt_row['proposer_id'], $msg);
                    $m_notif->execute();
                    $m_notif->close();
                }
            }
            $evt_stmt->close();
        }
    }
}

$conn->close();
http_response_code(201);
echo json_encode([
    'success'  => true,
    'message'  => "Successfully registered as $role_label for the event.",
    'qr_token' => $qr_token,
    'role'     => $reg_role,
]);
?>
