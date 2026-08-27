<?php
/**
 * backend/get_approval_rules.php
 * Fetches all global routing configurations.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
require_auth();
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    
    $res = $conn->query("SELECT id, scale_name, required_chain FROM approval_rules ORDER BY id ASC");
    $rules = [];
    
    while ($row = $res->fetch_assoc()) {
        $rules[] = [
            'id' => (int)$row['id'],
            'scale_name' => $row['scale_name'],
            'required_chain' => json_decode($row['required_chain'], true)
        ];
    }
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'data' => $rules
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
