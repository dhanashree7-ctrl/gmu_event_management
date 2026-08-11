<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

// Check the password hash for these accounts and test common passwords
$test_passwords = ['password', 'password123', 'Test@123', 'gmu@123', 'admin123', '123456', 'student123', 'faculty123'];

$stmt = $conn->prepare("SELECT usn_or_emp_id, email, full_name, system_role, password FROM users WHERE system_role IN ('student','faculty') LIMIT 2");
$stmt->execute();
$res = $stmt->get_result();

while ($r = $res->fetch_assoc()) {
    echo $r['system_role'] . ": " . $r['full_name'] . " (" . $r['email'] . ")\n";
    echo "  Hash: " . substr($r['password'], 0, 60) . "...\n";
    $found = false;
    foreach ($test_passwords as $p) {
        if (password_verify($p, $r['password'])) {
            echo "  ✅ Password is: $p\n";
            $found = true;
            break;
        }
    }
    if (!$found) echo "  ❓ Password hash doesn't match common passwords\n";
    echo "\n";
}
$conn->close();
?>
