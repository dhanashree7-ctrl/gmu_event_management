<?php
/**
 * backend/mark_notification_read.php
 * ---------------------------------------------------------------
 * Marks a specific notification as read.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$notification_id = $input['notification_id'] ?? $_POST['notification_id'] ?? null;

if (empty($notification_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'notification_id is required.']);
    exit;
}

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = "UPDATE Notifications SET is_read = TRUE WHERE id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database prepare failed.']);
    $conn->close();
    exit;
}

$stmt->bind_param('i', $notification_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Notification marked as read.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database execution failed.']);
}

$stmt->close();
$conn->close();
?>
