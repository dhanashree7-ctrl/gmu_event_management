<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection(); // Connects to GMU_Events01

// Connect to old DB
$old = new mysqli('localhost', 'root', 'dhanashreessql2025', 'gmu_events', 3306);
$old->set_charset('utf8mb4');

// Get old rules
$res = $old->query("SELECT * FROM approval_rules");
$old_rules = [];
while ($row = $res->fetch_assoc()) {
    $old_rules[] = $row;
}

if (empty($old_rules)) {
    echo "No rules found in old database.\n";
    exit;
}

// Clear current table in GMU_Events01
$conn->query("TRUNCATE TABLE approval_rules");

// Insert old rules into new table
$count = 0;
$stmt = $conn->prepare("INSERT INTO approval_rules (scale_name, required_chain) VALUES (?, ?)");
foreach ($old_rules as $r) {
    $scale = $r['scale_name'];
    $chain = $r['required_chain']; // already a JSON string in old DB
    $stmt->bind_param("ss", $scale, $chain);
    if ($stmt->execute()) {
        $count++;
    }
}

echo "✅ Successfully migrated $count approval rules from the old gmu_events database to GMU_Events01.\n";

$old->close();
$conn->close();
?>
