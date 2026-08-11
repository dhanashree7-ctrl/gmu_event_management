<?php
/**
 * backend/get_student_events.php
 * Fetches all events a specific student is registered for.
 * Joins event_registrations with event_master for event details.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo json_encode(['success' => false, 'message' => 'PHP Fatal Error: ' . $error['message']]);
    }
});

$studentId = $_GET['student_id'] ?? null;
if (!$studentId) {
    echo json_encode(['success' => false, 'message' => 'Missing student_id parameter.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Map student_id to usn_or_emp_id
$usn_stmt = $conn->prepare("SELECT usn_or_emp_id FROM users WHERE usn_or_emp_id = ? OR id = ? LIMIT 1");
$usn_stmt->bind_param('ss', $studentId, $studentId);
$usn_stmt->execute();
$usn_row = $usn_stmt->get_result()->fetch_assoc();
$usn_stmt->close();
$student_usn = $usn_row['usn_or_emp_id'] ?? $studentId;

$stmt = $conn->prepare("
    SELECT em.SL_NO AS id, em.EVENT AS event_title,
           em.START_DATE AS event_date, em.START_TIME AS event_time,
           em.VENUE AS venue, em.CATEGORY AS category, emd.BROUCHER AS brochure_path,
           r.CHECK_IN_STATUS AS check_in_status, r.CHECK_IN_TIME AS check_in_time,
           r.ROLE AS registration_role, r.details_json AS reg_details
    FROM event_registrations r
    JOIN event_master em ON r.EVENT_ID = em.SL_NO
    LEFT JOIN event_metadata emd ON emd.EVENT_ID = em.SL_NO
    WHERE r.STUDENT_ID = ?
    ORDER BY em.START_DATE ASC
");

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Query preparation failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("s", $student_usn);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();
$events = [];
while ($row = $result->fetch_assoc()) {
    $events[] = [
        'id'                => (int)($row['id'] ?? 0),
        'event_title'       => $row['event_title']        ?? 'Unknown',
        'event_date'        => $row['event_date']          ?: null,
        'event_time'        => $row['event_time']          ?: null,
        'date'              => $row['event_date']          ?: null,
        'time'              => $row['event_time']          ?: null,
        'venue'             => $row['venue']               ?: 'TBD',
        'category'          => $row['category']            ?: 'Uncategorized',
        'brochure_path'     => $row['brochure_path']       ?? '',
        'check_in_status'   => $row['check_in_status']     ?? 'registered',
        'check_in_time'     => $row['check_in_time']       ?? null,
        'registration_role' => $row['registration_role']   ?? 'participant',
        'my_role'           => $row['registration_role']   ?? 'participant',
        'reg_details'       => !empty($row['reg_details']) ? json_decode($row['reg_details'], true) : null,
    ];
}

echo json_encode(['success' => true, 'data' => $events]);
$stmt->close(); $conn->close();
?>
