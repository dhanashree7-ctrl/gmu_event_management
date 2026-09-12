<?php
/**
 * backend/get_all_events_admin.php
 * Fetches all events (regardless of status) for the Events Admin dashboard.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth = require_auth();

if (($auth['role'] ?? '') !== 'events_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    $sql = "SELECT EVENT_ID AS id, EVENT AS event_title, START_DATE AS event_date, CATEGORY AS category, STATUS AS status 
            FROM event_master 
            ORDER BY CREATED_ON DESC";
    $result = $conn->query($sql);
    
    $events = [];
    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }
    
    echo json_encode(['success' => true, 'data' => $events]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
