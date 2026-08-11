<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$roles = ['student', 'faculty'];
foreach ($roles as $role) {
    $stmt = $conn->prepare("SELECT usn_or_emp_id, username, email, full_name, department, system_role FROM users WHERE system_role = ? LIMIT 3");
    $stmt->bind_param("s", $role);
    $stmt->execute();
    $res = $stmt->get_result();
    echo strtoupper($role) . " accounts:\n";
    while ($r = $res->fetch_assoc()) {
        echo "  Name:       " . $r['full_name'] . "\n";
        echo "  USN/EmpID:  " . $r['usn_or_emp_id'] . "\n";
        echo "  Username:   " . $r['username'] . "\n";
        echo "  Email:      " . $r['email'] . "\n";
        echo "  Department: " . $r['department'] . "\n";
        echo "  ---\n";
    }
    echo "\n";
}
$conn->close();
?>
