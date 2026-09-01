<?php
/**
 * backend/add_user.php
 * ---------------------------------------------------------------
 * Admin endpoint to add a new user to the system.
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$full_name = trim($input['full_name'] ?? '');
$usn_or_emp_id = trim($input['usn_or_emp_id'] ?? '');

$password = trim($input['password'] ?? '');
$system_role = trim($input['system_role'] ?? '');
$department = trim($input['department'] ?? '');

if ($full_name === '' || $usn_or_emp_id === '' || $password === '' || $system_role === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

// Validate ENUM
$allowed_roles = ['student','faculty','hod','director','dean','pro_vc','vc','admin','events_admin'];
if (!in_array($system_role, $allowed_roles)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid system DESIGNATION selected.']);
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

// Check if user exists
$check_stmt = $conn->prepare("SELECT ID FROM users WHERE USER_NAME = ?");
$check_stmt->bind_param('s', $usn_or_emp_id);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'A user with this USN/Emp ID already exists.']);
    $check_stmt->close();
    $conn->close();
    exit;
}
$check_stmt->close();

$hashed_password = password_hash($password, PASSWORD_BCRYPT);

$ins_stmt = $conn->prepare("
    INSERT INTO users (USER_NAME, NAME, PASSWORD, DESIGNATION, DISCIPLINE) 
    VALUES (?, ?, ?, ?, ?)
");
$ins_stmt->bind_param('sssss', $usn_or_emp_id, $full_name, $hashed_password, $system_role, $department);

if ($ins_stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User created successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to create user: ' . $conn->error]);
}

$ins_stmt->close();
$conn->close();
?>


