<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$student_pass  = password_hash('Student@123', PASSWORD_DEFAULT);
$faculty_pass  = password_hash('Faculty@123', PASSWORD_DEFAULT);

// Reset 3 student accounts
$conn->query("UPDATE users SET password = '$student_pass', password_hash = '$student_pass' WHERE system_role = 'student' LIMIT 3");
$student_count = $conn->affected_rows;

// Reset 3 faculty accounts
$conn->query("UPDATE users SET password = '$faculty_pass', password_hash = '$faculty_pass' WHERE system_role = 'faculty' LIMIT 3");
$faculty_count = $conn->affected_rows;

echo "✅ Reset $student_count student accounts to: Student@123\n";
echo "✅ Reset $faculty_count faculty accounts to: Faculty@123\n\n";

// Print the accounts
$res = $conn->query("SELECT usn_or_emp_id, email, full_name, department, system_role FROM users WHERE system_role IN ('student','faculty') ORDER BY system_role LIMIT 6");
$current_role = '';
while ($r = $res->fetch_assoc()) {
    if ($r['system_role'] !== $current_role) {
        $current_role = $r['system_role'];
        echo "\n--- " . strtoupper($current_role) . " ---\n";
    }
    echo "  Name:       " . $r['full_name'] . "\n";
    echo "  Login ID:   " . $r['usn_or_emp_id'] . "\n";
    echo "  Email:      " . $r['email'] . "\n";
    echo "  Department: " . $r['department'] . "\n";
    echo "  Password:   " . ($current_role === 'student' ? 'Student@123' : 'Faculty@123') . "\n\n";
}
$conn->close();
?>
