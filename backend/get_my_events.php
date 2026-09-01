<?php
/**
 * backend/get_my_events.php
 * Returns all events proposed by a specific user from event_master.
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use GET.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$USER_NAME = $auth_payload['username'];

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = 'SELECT
            em.EVENT_ID AS id,
            em.EVENT_TITLE AS event_title,
            em.CATEGORY AS category,
            em.SCALE AS event_scale,
            em.CURRENT_STATUS AS current_status,
            em.BUDGET AS budget,
            em.ATTACHMENTS AS attachments_json,
            em.MODE AS event_mode,
            em.START_DATE AS event_date,
            em.START_DATE AS submitted_at,
            em.MAX_PARTICIPANTS AS max_participants,
            em.REGISTRATION_DEADLINE AS registration_deadline,
            em.COORDINATOR_NAME AS coordinator_name,
            em.CORDINATOR_CONTACT AS coordinator_number
        FROM event_master em
        WHERE em.PROPOSER_ID = ?
        ORDER BY em.START_DATE DESC';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log('get_my_events.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$stmt->bind_param('s', $USER_NAME);
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
        'id'                   => $row['id'],
        'event_title'          => $row['event_title'],
        'category'             => $row['category'],
        'event_scale'          => $row['event_scale'],
        'status'               => $row['current_status'],
        'current_status'       => $row['current_status'],
        'budget'               => $row['budget'],
        'remarks'              => null, // removed
        'event_mode'           => $row['event_mode'],
        'event_date'           => $row['event_date'],
        'start_date'           => $row['event_date'],
        'end_date'             => $row['event_date'],
        'submitted_at'         => $row['submitted_at'],
        'max_participants'     => $row['max_participants'],
        'registration_deadline'=> $row['registration_deadline'],
        'coordinator_name'     => $row['coordinator_name'],
        'coordinator_number'   => $row['coordinator_number'],
        'involved_departments' => [],
        'details'              => !empty($row['attachments_json']) ? json_decode($row['attachments_json'], true) : null,
    ];
}
$stmt->close(); $conn->close();

http_response_code(200);
echo json_encode(['success' => true, 'data' => $events]);
?>

