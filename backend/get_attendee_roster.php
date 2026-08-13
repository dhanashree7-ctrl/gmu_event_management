<?php
/**
 * backend/get_attendee_roster.php
 * Fetches roster of attendees for a specific event.
 * Joins event_registrations with users (for name/email) and event_master (for capacities).
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

$event_id = filter_var($body['event_id'] ?? null, FILTER_VALIDATE_INT);
if (!$event_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid event_id is required.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Fetch capacities from event_metadata and START_DATE from event_master
$cap_stmt = $conn->prepare("
    SELECT emd.MAX_PARTICIPANTS, emd.MAX_VOLUNTEERS, emd.MAX_COORDINATORS, em.START_DATE 
    FROM event_master em 
    LEFT JOIN event_metadata emd ON em.SL_NO = emd.EVENT_ID 
    WHERE em.SL_NO = ?
");
$cap_stmt->bind_param('i', $event_id);
$cap_stmt->execute();
$cap_row = $cap_stmt->get_result()->fetch_assoc();
$cap_stmt->close();

$capacities = [
    'max_participants' => $cap_row ? ($cap_row['MAX_PARTICIPANTS'] !== null ? (int)$cap_row['MAX_PARTICIPANTS'] : null) : null,
    'max_volunteers'   => $cap_row ? ($cap_row['MAX_VOLUNTEERS']   !== null ? (int)$cap_row['MAX_VOLUNTEERS']   : null) : null,
    'max_coordinators' => $cap_row ? ($cap_row['MAX_COORDINATORS'] !== null ? (int)$cap_row['MAX_COORDINATORS'] : null) : null,
];
$event_date = $cap_row['START_DATE'] ?? null;

// Fetch attendees from event_registrations JOIN users
$sql = "SELECT
            er.ID                     AS registration_id,
            er.STUDENT_ID             AS student_uid,
            er.ROLE                   AS registration_role,
            er.SPECIAL_REQUIREMENTS   AS special_requirements,
            er.CHECK_IN_STATUS        AS check_in_status,
            er.CHECK_IN_TIME          AS check_in_time,
            er.REGISTRATION_DATE      AS registered_at,
            u.full_name               AS student_name,
            u.email                   AS student_email,
            u.usn_or_emp_id           AS usn,
            u.department              AS department,
            u.semester                AS semester
        FROM event_registrations er
        LEFT JOIN users u ON er.STUDENT_ID = u.usn_or_emp_id
        WHERE er.EVENT_ID = ?
        ORDER BY er.ROLE ASC, er.REGISTRATION_DATE DESC";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}
$stmt->bind_param('i', $event_id);
if (!$stmt->execute()) {
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch attendee roster.']);
    exit;
}

$result    = $stmt->get_result();
$attendees = [];
while ($row = $result->fetch_assoc()) {
    $attendees[] = [
        'registration_id'      => (int)$row['registration_id'],
        'username'             => $row['student_uid'],
        'usn'                  => $row['usn'] ?? $row['student_uid'],
        'student_name'         => $row['student_name']  ?? 'Unknown Student',
        'student_email'        => $row['student_email'] ?? 'N/A',
        'registration_role'    => $row['registration_role']    ?? 'participant',

        'special_requirements' => $row['special_requirements'] ?? 'None',
        'topics_of_interest'   => 'None',
        'check_in_status'      => $row['check_in_status'] ?? 'pending',
        'check_in_time'        => $row['check_in_time'],
        'registered_at'        => $row['registered_at'],
        'event_date'           => $event_date,
        'department'           => $row['department'],
        'semester'             => $row['semester'],
    ];
}

$stmt->close(); $conn->close();
http_response_code(200);
echo json_encode(['success' => true, 'data' => $attendees, 'capacities' => $capacities]);
?>
