<?php
require 'config/database.php';
header('Content-Type: application/json');

try {
    // Check if column exists
    $result = $conn->query("SHOW COLUMNS FROM notifications LIKE 'is_bell_dismissed'");
    if ($result->num_rows == 0) {
        $conn->query("ALTER TABLE notifications ADD COLUMN is_bell_dismissed TINYINT(1) DEFAULT 0 AFTER is_read");
        echo json_encode(['success' => true, 'message' => 'Column added successfully.']);
    } else {
        echo json_encode(['success' => true, 'message' => 'Column already exists.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
