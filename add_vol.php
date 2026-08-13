<?php
require_once __DIR__ . '/backend/config/db.php';
$conn = get_db_connection();
$hash = password_hash('pass123', PASSWORD_BCRYPT);
$stmt = $conn->prepare("INSERT INTO users (username, full_name, email, password, system_role, role, usn_or_emp_id, is_active) VALUES ('volunteer1', 'Volunteer One', 'volunteer1@gmu.ac.in', ?, 'volunteer', 'volunteer', 'VOL001', 1)");
$stmt->bind_param('s', $hash);
$stmt->execute();
echo 'Volunteer added!';
?>
