<?php
/**
 * backend/update_settings.php
 * ---------------------------------------------------------------
 * Handles password updates from the Settings tab.
 * Accepts: username, current_password, new_password
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo json_encode(['success' => false, 'message' => 'PHP Fatal Error: ' . $error['message'] . ' on line ' . $error['line']]);
    }
});

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$username = trim($body['username'] ?? '');
$current_password = trim($body['current_password'] ?? '');
$new_password = trim($body['new_password'] ?? '');

if ($username === '' || $current_password === '' || $new_password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username, current password, and new password are required.']);
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

// Check current password
$sql = 'SELECT id, password FROM users WHERE username = ? LIMIT 1';
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal server error (prepare).']);
    exit;
}

$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit;
}

// TEMPORARY: Direct string comparison for the 'pass123' sandbox.
if ($current_password !== $user['password']) {
    echo json_encode(['success' => false, 'message' => 'Incorrect current password.']);
    exit;
}

// Update to new password
$update_sql = 'UPDATE users SET password = ? WHERE id = ?';
$update_stmt = $conn->prepare($update_sql);
if (!$update_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal server error (update prepare).']);
    exit;
}

$update_stmt->bind_param('si', $new_password, $user['id']);
if ($update_stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Password updated successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update password.']);
}

$update_stmt->close();
$conn->close();
?>

