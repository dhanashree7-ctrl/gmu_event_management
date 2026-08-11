<?php
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();

    $sql1 = "
    CREATE TABLE IF NOT EXISTS approval_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        scale_name VARCHAR(100) NOT NULL UNIQUE,
        required_chain JSON NOT NULL
    )";
    $conn->query($sql1);

    $sql2 = "
    INSERT INTO approval_rules (scale_name, required_chain) VALUES 
    ('department', '[\"hod\"]'),
    ('faculty', '[\"hod\", \"director\"]'),
    ('university', '[\"hod\", \"dean\", \"pro_vc\", \"vc\"]'),
    ('state', '[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),
    ('national', '[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]'),
    ('international', '[\"hod\", \"director\", \"dean\", \"pro_vc\", \"vc\"]')
    ON DUPLICATE KEY UPDATE required_chain = VALUES(required_chain)";
    $conn->query($sql2);

    $sql3 = "
    INSERT IGNORE INTO users (usn_or_emp_id, full_name, email, password, system_role, department) 
    VALUES ('admin_events', 'Events System Administrator', 'admin@gmu.edu', 'pass123', 'events_admin', 'Administration')";
    $conn->query($sql3);

    echo "Successfully created and seeded approval_rules and events_admin user.\n";
    $conn->close();
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
