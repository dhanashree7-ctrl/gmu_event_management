<?php
require_once __DIR__ . '/../config/db.php';

$old = new mysqli('localhost', 'root', 'dhanashreessql2025', 'gmu_events', 3306);
$new = get_db_connection(); // GMU_Events01

$tables = [
    'users', 
    'event_master', 
    'event_metadata', 
    'event_registrations', 
    'notifications', 
    'approval_rules'
];

echo str_pad("TABLE", 25) . str_pad("OLD (gmu_events)", 20) . str_pad("NEW (GMU_Events01)", 20) . "\n";
echo str_repeat("-", 65) . "\n";

foreach ($tables as $t) {
    // Old DB count
    $resOld = $old->query("SELECT COUNT(*) as c FROM `$t`");
    $countOld = $resOld ? $resOld->fetch_assoc()['c'] : 'Missing';
    
    // New DB count
    $resNew = $new->query("SELECT COUNT(*) as c FROM `$t`");
    $countNew = $resNew ? $resNew->fetch_assoc()['c'] : 'Missing';
    
    echo str_pad($t, 25) . str_pad((string)$countOld, 20) . str_pad((string)$countNew, 20) . "\n";
}

$old->close();
$new->close();
?>
