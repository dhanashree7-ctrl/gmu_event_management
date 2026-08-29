<?php
require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();

$new_password = 'pass123';
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);

$sql = "UPDATE users SET PASSWORD = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    die("Prepare failed: " . $conn->error);
}

$stmt->bind_param('s', $new_hash);
if ($stmt->execute()) {
    echo "Successfully updated all passwords to pass123.\n";
} else {
    echo "Error updating passwords: " . $stmt->error;
}
$stmt->close();
$conn->close();
?>
