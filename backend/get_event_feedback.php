<?php
/**
 * backend/get_event_feedback.php
 * ---------------------------------------------------------------
 * Fetches feedback insights for a completed event.
 * Reads from event_registrations.FEEDBACK_RATING / FEEDBACK_COMMENTS.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use GET.']);
    exit;
}

$event_id = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;

if ($event_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid event_id.']);
    exit;
}

require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// ── Stats: count and average from event_registrations ────────────────────────
$stats_sql = "
    SELECT COUNT(*) AS total_feedback, AVG(FEEDBACK_RATING) AS average_rating
    FROM event_registrations
    WHERE EVENT_ID = ? AND FEEDBACK_RATING IS NOT NULL
";
$stmt = $conn->prepare($stats_sql);
$stmt->bind_param('i', $event_id);
$stmt->execute();
$stats = $stmt->get_result()->fetch_assoc();
$stmt->close();

$total   = (int)$stats['total_feedback'];
$average = $stats['average_rating'] !== null ? round((float)$stats['average_rating'], 1) : 0;

// ── Comments: join with users for name ────────────────────────────────────────
$comments_sql = "
    SELECT
        er.FEEDBACK_RATING AS rating,
        er.FEEDBACK_COMMENTS AS comments,
        er.REGISTRATION_DATE AS created_at,
        u.full_name AS student_name
    FROM event_registrations er
    LEFT JOIN users u ON er.STUDENT_ID = u.usn_or_emp_id
    WHERE er.EVENT_ID = ? AND er.FEEDBACK_RATING IS NOT NULL
    ORDER BY er.REGISTRATION_DATE DESC
";
$stmt = $conn->prepare($comments_sql);
$stmt->bind_param('i', $event_id);
$stmt->execute();
$comments_res = $stmt->get_result();

$comments = [];
while ($row = $comments_res->fetch_assoc()) {
    $comments[] = $row;
}
$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'data'    => [
        'total_feedback'  => $total,
        'average_rating'  => $average,
        'comments'        => $comments,
    ],
]);
?>
