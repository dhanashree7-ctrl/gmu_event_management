<?php
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    $conn->autocommit(FALSE);

    $defaultPassword = password_hash('pass123', PASSWORD_DEFAULT);

    $admins = [
        ['name' => 'Dr. Dean', 'email' => 'dean@gmu.ac.in', 'role' => 'dean', 'emp_id' => 'DEAN001', 'dept' => 'Administration'],
        ['name' => 'Prof. HOD CSE', 'email' => 'hod_cse@gmu.ac.in', 'role' => 'hod', 'emp_id' => 'HOD001', 'dept' => 'CSE'],
        ['name' => 'Prof. HOD AIML', 'email' => 'hod_aiml@gmu.ac.in', 'role' => 'hod', 'emp_id' => 'HOD002', 'dept' => 'AIML'],
        ['name' => 'Director', 'email' => 'director@gmu.ac.in', 'role' => 'director', 'emp_id' => 'DIR001', 'dept' => 'Administration'],
        ['name' => 'Pro VC', 'email' => 'provc@gmu.ac.in', 'role' => 'provc', 'emp_id' => 'PROVC01', 'dept' => 'Administration'],
        ['name' => 'Vice Chancellor', 'email' => 'vc@gmu.ac.in', 'role' => 'vc', 'emp_id' => 'VC001', 'dept' => 'Administration'],
        ['name' => 'Student Affairs Head', 'email' => 'sa@gmu.ac.in', 'role' => 'student_affairs', 'emp_id' => 'SA001', 'dept' => 'Student Affairs'],
        ['name' => 'Events Admin', 'email' => 'events_admin@gmu.ac.in', 'role' => 'events_admin', 'emp_id' => 'EVT001', 'dept' => 'Events Management'],
    ];

    $stmt = $conn->prepare("INSERT INTO users (NAME, EMAIL, PASSWORD, ROLE, DEPT, USERNAME) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($admins as $a) {
        $stmt->bind_param("ssssss", $a['name'], $a['email'], $defaultPassword, $a['role'], $a['dept'], $a['emp_id']);
        try {
            $stmt->execute();
        } catch (Exception $e) {
            // Ignore duplicates if they already exist
        }
    }

    $conn->commit();
    echo "Administrators successfully restored!\n";

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) $conn->close();
}
?>
