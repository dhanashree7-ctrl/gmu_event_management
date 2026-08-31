<?php
/**
 * backend/get_archived_events.php
 * Fetches all completed events from event_master with participant count and avg rating.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
require_auth();
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = "
    SELECT
        em.EVENT_ID AS id,
        em.EVENT_TITLE AS event_title,
        em.START_DATE AS event_date,
        COALESCE(em.CATEGORY, 'Uncategorized') AS category,
        COALESCE(u.NAME, 'System / Legacy') AS proposed_by,
        em.ATTACHMENTS AS attachments_json,
        em.MAX_PARTICIPANTS AS max_participants,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.EVENT_ID = em.EVENT_ID) AS total_participants,
        (SELECT COALESCE(AVG(JSON_EXTRACT(er2.FEEDBACK_JSON, '$.rating')), 0) FROM event_registrations er2 WHERE er2.EVENT_ID = em.EVENT_ID AND er2.FEEDBACK_JSON IS NOT NULL) AS average_rating
    FROM event_master em
    LEFT JOIN users u ON em.PROPOSER_ID = u.USERNAME
    WHERE em.CURRENT_STATUS = 'completed'
    ORDER BY em.START_DATE DESC
";

$result = $conn->query($sql);
if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database query failed: ' . $conn->error]);
    exit;
}

$events = [];
while ($row = $result->fetch_assoc()) {
    $date          = $row['event_date'];
    $academic_year = 'Unknown';
    if ($date) {
        $month = (int)date('n', strtotime($date));
        $year  = (int)date('Y', strtotime($date));
        $academic_year = ($month >= 8) ? "$year-" . ($year + 1) : ($year - 1) . "-$year";
    }
    $row['academic_year']  = $academic_year;
    $row['average_rating'] = round((float)$row['average_rating'], 1);
    $attachments = !empty($row['attachments_json']) ? json_decode($row['attachments_json'], true) : [];
    
    $row['post_event_report'] = $attachments['report'] ? 'Submitted' : null;
    $row['report_file_path'] = $attachments['report'] ?? null;
    $row['gallery_images'] = $attachments['gallery_images'] ?? [];
    
    unset($row['attachments_json']); // keep payload clean
    $events[] = $row;
}

$conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>

