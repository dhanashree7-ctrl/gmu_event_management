<?php
/**
 * backend/login.php
 * ---------------------------------------------------------------
 * Handles user authentication for the University Event Management System.
 * (Currently adapted for the Phase 5 Developer Sandbox)
 */

declare(strict_types=1);

// ---------- CORS headers (adjust origin to your React dev URL) ----------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Relaxed for dev, restrict in prod
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle browser pre-flight (OPTIONS) request.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- Guard: only POST is accepted ---------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

// ---------- Parse & validate request body --------------------------------
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

// We are now checking 'username' instead of 'email'
$username = trim($body['username'] ?? '');
$password = trim($body['password'] ?? '');

// Basic presence validation.
if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

// ---------- Database lookup ----------------------------------------------
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

/*
 * Fetching the exact columns from our new Enterprise Schema
 */
$sql = 'SELECT id, usn_or_emp_id, username, full_name, email, password, system_role, department, school_name
         FROM   users
         WHERE  username = ? OR usn_or_emp_id = ? OR email = ?
         LIMIT  1';

$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log('login.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error. Please try again.']);
    exit;
}

$stmt->bind_param('sss', $username, $username, $username);

if (!$stmt->execute()) {
    error_log('login.php – execute failed: ' . $stmt->error);
    $stmt->close();
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error. Please try again.']);
    exit;
}

$result = $stmt->get_result();
$user = $result->fetch_assoc();   // null if no row was found

$stmt->close();
$conn->close();

// ---------- Verify password ----------------------------------------------

$genericError = 'Invalid username or password.';

if ($user === null) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $genericError]);
    exit;
}

// Check password (supports both hashed and plaintext for legacy)
if (!password_verify($password, $user['password']) && $password !== $user['password']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $genericError]);
    exit;
}

// ---------- Success — return safe user data ------------------------------
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'data' => [
        'id' => (int) $user['id'],
        'username' => $user['usn_or_emp_id'],
        'name' => $user['full_name'],
        'role' => $user['system_role'],
        'department_name' => $user['department'],
        'school_name' => $user['school_name'] ?? 'N/A',
    ],
]);
?>