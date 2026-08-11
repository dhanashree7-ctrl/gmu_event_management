<?php
/**
 * backend/update_approval_rules.php
 * Updates a specific routing configuration.
 */
declare(strict_types=1);

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
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
$required_chain = $body['required_chain'] ?? null;

if (!$id || !is_array($required_chain)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid id and required_chain array are required.']);
    exit;
}

require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    
    $stmt = $conn->prepare("UPDATE approval_rules SET required_chain = ? WHERE id = ?");
    $chain_json = json_encode($required_chain);
    
    $stmt->bind_param('si', $chain_json, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Rules updated successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update rules.']);
    }
    
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
