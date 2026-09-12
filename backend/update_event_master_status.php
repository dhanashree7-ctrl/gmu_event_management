<?php
/**
 * backend/update_event_master_status.php
 * Toggles the STATUS (active/inactive) of an event.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth = require_auth();
if (($auth['role'] ?? '') !== 'events_admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden: Only events_admin can perform this action.']);
    exit;
}

$event_id = $_POST['event_id'] ?? '';
$new_status = $_POST['status'] ?? '';

if (empty($event_id) || empty($new_status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing event_id or status.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();

$stmt = $conn->prepare("UPDATE event_master SET STATUS = ? WHERE EVENT_ID = ? OR SL_NO = ?");
$stmt->bind_param("sss", $new_status, $event_id, $event_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Event status updated.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}

$stmt->close();
$conn->close();
