<?php
require_once __DIR__ . '/../config/db.php';

try {
    $conn = get_db_connection();
    $conn->autocommit(FALSE);

    // Clear old data
    $conn->query("TRUNCATE TABLE approval_rules");

    $stmt = $conn->prepare("INSERT INTO approval_rules (scale_name, event_type, level, role, role_name, required_chain) VALUES (?, 'Any', ?, ?, ?, '[]')");

    $rules = [
        'Department' => ['hod'],
        'Faculty' => ['hod', 'director'],
        'University' => ['hod', 'dean', 'pro_vc', 'vc'],
        'State' => ['hod', 'director', 'dean', 'pro_vc', 'vc'],
        'National' => ['hod', 'director', 'dean', 'pro_vc', 'vc'],
        'International' => ['hod', 'director', 'dean', 'pro_vc', 'vc']
    ];

    $roleNames = [
        'hod' => 'HOD',
        'director' => 'Director',
        'dean' => 'Dean',
        'pro_vc' => 'Pro-VC',
        'vc' => 'VC'
    ];

    foreach ($rules as $scale => $chain) {
        $level = 1;
        foreach ($chain as $role) {
            $roleName = $roleNames[$role] ?? ucfirst($role);
            $stmt->bind_param("siss", $scale, $level, $role, $roleName);
            $stmt->execute();
            $level++;
        }
    }

    $conn->commit();
    echo "Approval rules successfully updated to match the old logic!";

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo "Error: " . $e->getMessage();
} finally {
    if (isset($conn)) $conn->close();
}
?>
