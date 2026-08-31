<?php
/**
 * backend/update_fcm_token.php
 * ─────────────────────────────────────────────────────────────────
 * [FIREBASE MIGRATION — PHASE 3]
 * Receives a Firebase Cloud Messaging (FCM) web push token from the
 * React frontend and persists it against the authenticated user's row
 * in the `users` table (fcm_web_token column).
 *
 * Method : POST
 * Auth   : Bearer token or username in payload
 * Body   : { "fcm_token": "<FCM_REGISTRATION_TOKEN>", "username": "<OPTIONAL_USERNAME>" }
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

// ── Auth / Username Resolution ───────────────────────────────────
require_once __DIR__ . '/auth_middleware.php';

$username = '';
$headers = getallheaders();
$auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (!empty($auth_header)) {
    try {
        $auth_payload = require_auth();
        $username = trim((string)($auth_payload['username'] ?? ''));
    } catch (Throwable $t) {
        // Fallback to body username if token verification throws
    }
}

// ── Parse body ───────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$body = json_decode((string)$raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

if ($username === '' && !empty($body['username'])) {
    $username = trim((string)$body['username']);
}

if ($username === '') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized. Invalid session or missing username.']);
    exit;
}

$fcm_token = trim((string)($body['fcm_token'] ?? ''));

if ($fcm_token === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'fcm_token is required.']);
    exit;
}

if (strlen($fcm_token) > 500) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'fcm_token exceeds maximum length.']);
    exit;
}

// ── DB ───────────────────────────────────────────────────────────
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// 2. Assign the token to the current user
$stmt = $conn->prepare('UPDATE users SET fcm_web_token = ? WHERE USERNAME = ?');
if (!$stmt) {
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$stmt->bind_param('ss', $fcm_token, $username);

if (!$stmt->execute()) {
    error_log("update_fcm_token.php – execute failed for user '$username': " . $stmt->error);
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update FCM token.']);
    exit;
}

$affected = $stmt->affected_rows;
$stmt->close();
$conn->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => $affected > 0
        ? 'FCM token registered successfully.'
        : 'FCM token unchanged (already up to date).',
]);
?>

