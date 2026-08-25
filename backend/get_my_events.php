<?php
/**
 * backend/get_my_events.php
 * Returns all events proposed by a specific user from event_master.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use GET.']);
    exit;
}

$user_id = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
if ($user_id === false || $user_id === null || $user_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid user_id is required.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = 'SELECT
            em.SL_NO AS id,
            em.EVENT AS event_title,
            em.CATEGORY AS category,
            em.EVENT_SCALE AS event_scale,
            em.CURRENT_STATUS AS current_status,
            emd.BUDGET AS budget,
            emd.REMARKS AS remarks,
            emd.DETAILS_JSON AS details_json,
            em.MODE AS event_mode,
            em.START_DATE AS event_date,
            em.LAST_UPDATED AS submitted_at
        FROM event_master em
        LEFT JOIN event_metadata emd ON emd.EVENT_ID = em.SL_NO
        WHERE em.CREATED_BY = ?
        ORDER BY em.SL_NO DESC';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log('get_my_events.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$stmt->bind_param('i', $user_id);
if (!$stmt->execute()) {
    error_log('get_my_events.php – execute failed: ' . $stmt->error);
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch events.']);
    exit;
}

$result = $stmt->get_result();
$events = [];
while ($row = $result->fetch_assoc()) {
    $events[] = [
        'id'                   => (int)$row['id'],
        'event_title'          => $row['event_title'],
        'category'             => $row['category'],
        'event_scale'          => $row['event_scale'],
        'status'               => $row['current_status'],
        'current_status'       => $row['current_status'],
        'budget'               => $row['budget'],
        'remarks'              => $row['remarks'],
        'event_mode'           => $row['event_mode'],
        'event_date'           => $row['event_date'],
        'start_date'           => $row['event_date'],
        'end_date'             => $row['event_date'],
        'submitted_at'         => $row['submitted_at'],
        'involved_departments' => [],
        'details'              => !empty($row['details_json']) ? json_decode($row['details_json'], true) : null,
    ];
}
$stmt->close(); $conn->close();

http_response_code(200);
echo json_encode(['success' => true, 'data' => $events]);
?>