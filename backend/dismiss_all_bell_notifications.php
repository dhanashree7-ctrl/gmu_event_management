<?php
/**
 * backend/dismiss_all_bell_notifications.php
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

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
require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$user_id = $auth_payload['username'] ?? null;

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'user_id is required.']);
    exit;
}

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = "UPDATE Notifications SET is_bell_dismissed = TRUE WHERE user_id = ? AND is_read = FALSE";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database prepare failed.']);
    $conn->close();
    exit;
}

$stmt->bind_param('s', $user_id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database execution failed.']);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'All notifications dismissed from bell']);
?>