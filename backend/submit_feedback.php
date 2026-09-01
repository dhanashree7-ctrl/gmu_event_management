<?php
/**
 * backend/submit_feedback.php
 * Submits feedback for a completed event by a checked-in student.
 * Updates FEEDBACK_RATING and FEEDBACK_COMMENTS in event_registrations.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




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

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();

$event_id   = isset($body['event_id'])   ? (string)$body['event_id']  : '';
$student_id = trim($auth_payload['USER_NAME'] ?? '');
$rating     = isset($body['rating'])     ? (int)$body['rating']    : 0;
$comments   = trim($body['comments']     ?? '');

if ($event_id === '' || $student_id === '' || $rating < 1 || $rating > 5) {
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

// 1. Resolve student USN first
$usn_stmt = $conn->prepare("SELECT USER_NAME FROM users WHERE USER_NAME = ? OR ID = ? LIMIT 1");
$usn_stmt->bind_param('ss', $student_id, $student_id);
$usn_stmt->execute();
$usn_row     = $usn_stmt->get_result()->fetch_assoc();
$usn_stmt->close();
$student_usn = $usn_row['USER_NAME'] ?? $student_id;

// 2. Verify: event is completed (via event_master) + student was checked in (via event_registrations)
$check_sql = "
    SELECT er.CHECK_IN_STATUS, em.CURRENT_STATUS
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE er.EVENT_ID = ? AND er.USER_ID = ?
";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param('ss', $event_id, $student_usn);
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


// 3. Check for duplicate feedback
$dup_stmt = $conn->prepare("SELECT FEEDBACK_JSON FROM event_registrations WHERE USER_ID = ? AND EVENT_ID = ?");
$dup_stmt->bind_param('ss', $student_usn, $event_id);
$dup_stmt->execute();
$dup_row = $dup_stmt->get_result()->fetch_assoc();
$dup_stmt->close();

$existing_feedback = !empty($dup_row['FEEDBACK_JSON']) ? json_decode($dup_row['FEEDBACK_JSON'], true) : [];
if (isset($existing_feedback['rating'])) {
    echo json_encode(['success' => false, 'message' => 'You have already submitted feedback for this event.']);
    $conn->close(); exit;
}

// 4. UPDATE event_registrations with feedback
$feedback_json = json_encode(['rating' => $rating, 'comment' => $comments]);
$update_stmt = $conn->prepare("UPDATE event_registrations SET FEEDBACK_JSON = ? WHERE USER_ID = ? AND EVENT_ID = ?");
$update_stmt->bind_param('sss', $feedback_json, $student_usn, $event_id);

if ($update_stmt->execute() && $update_stmt->affected_rows > 0) {
    $update_stmt->close(); $conn->close();
    echo json_encode(['success' => true, 'message' => 'Feedback submitted successfully!']);
} else {
    $update_stmt->close(); $conn->close();
    echo json_encode(['success' => false, 'message' => 'Failed to save feedback. Registration may not exist.']);
}
?>


