<?php
/**
 * add_approval_rule.php
 * Adds a new event scale (approval rule) to the global configuration.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/db.php';
try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    echo json_encode(["success" => false, "message" => "Connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$scale_name = $data['scale_name'] ?? '';

if (empty($scale_name)) {
    echo json_encode(["success" => false, "message" => "Scale name is required."]);
    exit();
}

// Ensure lowercase, trimmed
$scale_name = strtolower(trim($scale_name));

// Check if scale already exists
$stmt = $conn->prepare("SELECT id FROM approval_rules WHERE scale_name = ?");
$stmt->bind_param("s", $scale_name);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "A scale with this name already exists."]);
    $stmt->close();
    exit();
}
$stmt->close();

// Insert new rule with empty chain
$empty_chain = json_encode([]);
$stmt = $conn->prepare("INSERT INTO approval_rules (scale_name, required_chain) VALUES (?, ?)");
$stmt->bind_param("ss", $scale_name, $empty_chain);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "New event scale added successfully.", "id" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to add scale: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
