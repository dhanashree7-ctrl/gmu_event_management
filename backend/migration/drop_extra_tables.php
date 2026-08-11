<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$extra_tables = ['approvals', 'external_registrations', 'roles', 'workflow_hierarchy'];

echo "=== Row counts before deletion ===\n";
foreach ($extra_tables as $t) {
    $res = $conn->query("SELECT COUNT(*) as cnt FROM `$t`");
    $row = $res->fetch_assoc();
    echo " - $t: " . $row['cnt'] . " rows\n";
}

echo "\n=== Dropping tables ===\n";
foreach ($extra_tables as $t) {
    if ($conn->query("DROP TABLE IF EXISTS `$t`")) {
        echo " ✅ Dropped: $t\n";
    } else {
        echo " ❌ Failed to drop $t: " . $conn->error . "\n";
    }
}

echo "\n=== Remaining tables ===\n";
$res = $conn->query("SHOW TABLES");
while ($r = $res->fetch_row()) echo " - " . $r[0] . "\n";

$conn->close();
?>
