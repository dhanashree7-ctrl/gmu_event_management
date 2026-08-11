<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$columns_to_add = [
    ['event_registrations', 'feedback_rating', "INT DEFAULT NULL"],
    ['event_registrations', 'TEAM_LEAD',       "VARCHAR(100) DEFAULT NULL"],
    ['event_registrations', 'TEAM_MEMBERS',    "TEXT DEFAULT NULL"],
];

foreach ($columns_to_add as [$table, $col, $definition]) {
    // Check if column already exists
    $check = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$col'");
    if ($check->num_rows > 0) {
        echo "⏭️  Column already exists: $table.$col\n";
        continue;
    }
    $sql = "ALTER TABLE `$table` ADD COLUMN `$col` $definition";
    if ($conn->query($sql)) {
        echo "✅ Added column: $table.$col\n";
    } else {
        echo "❌ Error adding $table.$col: " . $conn->error . "\n";
    }
}

echo "\nDone. Run verify_schema.php again to confirm.";
$conn->close();
?>
