<?php
/**
 * backend/get_attended_events.php
 * Fetches completed events that a specific student checked into.
 * Joins event_registrations with event_master for event details.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use GET.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$student_id = trim($auth_payload['USER_NAME'] ?? '');

if ($student_id === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing USER_NAME in token.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Look up the student's USN
$usn_stmt = $conn->prepare("SELECT USER_NAME FROM users WHERE USER_NAME = ? OR ID = ? LIMIT 1");
$usn_stmt->bind_param('ss', $student_id, $student_id);
$usn_stmt->execute();
$usn_row = $usn_stmt->get_result()->fetch_assoc();
$usn_stmt->close();
$student_usn = $usn_row['USER_NAME'] ?? $student_id;

$sql = "
    SELECT
        em.EVENT_ID      AS id,
        em.EVENT_TITLE   AS event_title,
        em.DESCRIPTION   AS description,
        em.CATEGORY      AS category,
        em.SCALE         AS event_scale,
        em.START_DATE    AS event_date,
        em.START_TIME    AS event_time,
        em.VENUE         AS venue,
        em.ATTACHMENTS   AS attachments_json,
        IF(r.FEEDBACK_JSON IS NOT NULL, 1, 0) AS has_feedback
    FROM event_registrations r
    JOIN event_master em ON r.EVENT_ID = em.EVENT_ID
    WHERE r.USER_ID = ?
      AND r.CHECK_IN_STATUS = 'checked_in'
      AND em.CURRENT_STATUS = 'completed'
    ORDER BY em.START_DATE DESC, em.START_TIME DESC
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error (prepare)']);
    $conn->close(); exit;
}
$stmt->bind_param('s', $student_usn);
$stmt->execute();
$result = $stmt->get_result();

$events = [];
while ($row = $result->fetch_assoc()) {
    $attachments = !empty($row['attachments_json']) ? json_decode($row['attachments_json'], true) : [];
    $row['brochure_path'] = $attachments['brochure'] ?? null;
    unset($row['attachments_json']);

    $row['has_feedback'] = (bool)$row['has_feedback'];
    $events[] = $row;
}

$stmt->close(); $conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>


