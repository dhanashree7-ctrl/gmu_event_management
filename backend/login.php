<?php
/**
 * backend/login.php
 * ---------------------------------------------------------------
 * Handles user authentication for the University Event Management System.
 * (Currently adapted for the Phase 5 Developer Sandbox)
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
// ---------- CORS headers (adjust origin to your React dev URL) ----------
header('Content-Type: application/json; charset=utf-8');






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
require_once __DIR__ . '/auth_middleware.php';

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

/*
 * Fetching columns from the Enterprise users table.
 * Key mapping:
 *   USER_NAME   → application username / login identifier
 *   DESIGNATION → determines internal role via get_role_from_designation()
 *   DISCIPLINE  → department (e.g. CSE, ECE, CSE-AIML)
 *   FACULTY     → faculty (e.g. FET, GMIT)
 *   SCHOOL      → school (e.g. SCST, SE)
 *   device_token → FCM push notification token
 */
require_once __DIR__ . '/config/role_helper.php';

$sql = 'SELECT SL_NO, ID as ROLL_NO, USER_NAME, NAME, PASSWORD, DESIGNATION, USER_GROUP,
               DISCIPLINE, FACULTY, SCHOOL, device_token
         FROM   users
         WHERE  USER_NAME = ?
           AND  STATUS = \'ACTIVE\'
         LIMIT  1';

$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log('login.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error. Please try again.']);
    exit;
}

$stmt->bind_param('s', $username);

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

// Check password (supports both hashed and plaintext for sandbox/testing)
$dbPass = $user['PASSWORD'] ?? $user['password'] ?? '';
if (!password_verify($password, $dbPass) && $password !== $dbPass) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => $genericError]);
    exit;
}

// ---------- Success — map enterprise columns → app data -----------------
$derivedRole = get_role_from_designation(
    $user['DESIGNATION'] ?? '',
    $user['USER_GROUP'] ?? ''
);

$userData = [
    'id'              => (int) ($user['SL_NO'] ?? 0),
    'roll_no'         => $user['ROLL_NO'] ?? '',
    'username'        => $user['USER_NAME'] ?? '',
    'name'            => $user['NAME'] ?? '',
    'role'            => $derivedRole,
    'department_name' => $user['DISCIPLINE'] ?? '',
    'faculty_name'    => $user['FACULTY'] ?? 'N/A',
    'school_name'     => $user['SCHOOL'] ?? 'N/A',
    'designation'     => $user['DESIGNATION'] ?? '',
];

$token = generate_jwt($userData);

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'token' => $token,
    'data' => $userData,
]);
?>
