<?php
/**
 * backend/get_archived_events.php
 * Fetches all completed events from event_master with participant count and avg rating.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = "
    SELECT
        em.SL_NO AS id,
        em.EVENT AS event_title,
        em.START_DATE AS event_date,
        COALESCE(em.CATEGORY, 'Uncategorized') AS category,
        COALESCE(u.full_name, 'System / Legacy') AS proposed_by,
        emd.POST_EVENT_REPORT AS post_event_report,
        emd.REPORT_PDF_PATH AS report_file_path,
        emd.MAX_PARTICIPANTS AS max_participants,
        (SELECT COUNT(*) FROM event_registrations er WHERE er.EVENT_ID = em.SL_NO) AS total_participants,
        COALESCE(AVG(er2.FEEDBACK_RATING), 0) AS average_rating
    FROM event_master em
    LEFT JOIN event_metadata emd ON emd.EVENT_ID = em.SL_NO
    LEFT JOIN event_registrations er2 ON er2.EVENT_ID = em.SL_NO AND er2.FEEDBACK_RATING IS NOT NULL
    LEFT JOIN users u ON em.CREATED_BY = u.id
    WHERE em.CURRENT_STATUS = 'completed'
    GROUP BY em.SL_NO, emd.POST_EVENT_REPORT, emd.REPORT_PDF_PATH, emd.MAX_PARTICIPANTS, u.full_name
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
    $events[] = $row;
}

$conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>
