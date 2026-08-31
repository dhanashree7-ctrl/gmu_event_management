<?php
/**
 * backend/remove_fcm_token.php
 * ─────────────────────────────────────────────────────────────────
 * Called when a user logs out to remove their FCM token from the DB.
 * Prevents notifications from popping up on a logged-out browser.
 * ─────────────────────────────────────────────────────────────────
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';

try {
    $auth_payload = require_auth();
    $username = trim((string)($auth_payload['username'] ?? ''));
    if ($username === '') {
        throw new Exception("Missing username");
    }
} catch (Throwable $t) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$stmt = $conn->prepare('UPDATE users SET fcm_web_token = NULL WHERE USERNAME = ?');
if ($stmt) {
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $stmt->close();
}
$conn->close();

echo json_encode(['success' => true, 'message' => 'Token removed']);

