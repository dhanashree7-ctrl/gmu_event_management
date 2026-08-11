<?php
/**
 * backend/submit_feedback.php
 * Submits feedback for a completed event by a checked-in student.
 * Updates FEEDBACK_RATING and FEEDBACK_COMMENTS in event_registrations.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

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

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$event_id   = isset($body['event_id'])   ? (int)$body['event_id']  : 0;
$student_id = trim($body['student_id']   ?? '');
$rating     = isset($body['rating'])     ? (int)$body['rating']    : 0;
$comments   = trim($body['comments']     ?? '');

if ($event_id <= 0 || $student_id === '' || $rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid fields (rating must be 1-5).']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// 1. Verify: event is completed (via event_master) + student was checked in (via event_registrations)
$check_sql = "
    SELECT er.CHECK_IN_STATUS, em.CURRENT_STATUS
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE er.EVENT_ID = ? AND er.STUDENT_ID = ?
";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param('is', $event_id, $student_id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Registration not found for this event.']);
    $check_stmt->close(); $conn->close(); exit;
}
$row = $check_result->fetch_assoc();
$check_stmt->close();

if ($row['CURRENT_STATUS'] !== 'completed') {
    echo json_encode(['success' => false, 'message' => 'Feedback can only be submitted for completed events.']);
    $conn->close(); exit;
}
if ($row['CHECK_IN_STATUS'] !== 'checked_in') {
    echo json_encode(['success' => false, 'message' => 'Only attendees who checked in can leave feedback.']);
    $conn->close(); exit;
}

// 2. Resolve student USN
$usn_stmt = $conn->prepare("SELECT usn_or_emp_id FROM users WHERE usn_or_emp_id = ? OR id = ? LIMIT 1");
$usn_stmt->bind_param('ss', $student_id, $student_id);
$usn_stmt->execute();
$usn_row     = $usn_stmt->get_result()->fetch_assoc();
$usn_stmt->close();
$student_usn = $usn_row['usn_or_emp_id'] ?? $student_id;

// 3. Check for duplicate feedback
$dup_stmt = $conn->prepare("SELECT FEEDBACK_RATING FROM event_registrations WHERE STUDENT_ID = ? AND EVENT_ID = ?");
$dup_stmt->bind_param('si', $student_usn, $event_id);
$dup_stmt->execute();
$dup_row = $dup_stmt->get_result()->fetch_assoc();
$dup_stmt->close();

if ($dup_row && $dup_row['FEEDBACK_RATING'] !== null) {
    echo json_encode(['success' => false, 'message' => 'You have already submitted feedback for this event.']);
    $conn->close(); exit;
}

// 4. UPDATE event_registrations with feedback
$update_stmt = $conn->prepare("UPDATE event_registrations SET FEEDBACK_RATING = ?, FEEDBACK_COMMENTS = ? WHERE STUDENT_ID = ? AND EVENT_ID = ?");
$update_stmt->bind_param('issi', $rating, $comments, $student_usn, $event_id);

if ($update_stmt->execute() && $update_stmt->affected_rows > 0) {
    $update_stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'message' => 'Feedback submitted successfully!']);
} else {
    $update_stmt->close(); $conn->close();
    echo json_encode(['success' => false, 'message' => 'Failed to save feedback. Registration may not exist.']);
}
?>
