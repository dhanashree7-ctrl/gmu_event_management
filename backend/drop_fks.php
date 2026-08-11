<?php
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); } catch (Exception $e) { die("DB Error"); }

$db_name = 'event_management';
$sql = "
    SELECT TABLE_NAME, CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE REFERENCED_TABLE_SCHEMA = '$db_name'
      AND REFERENCED_TABLE_NAME IS NOT NULL
";
$result = $conn->query($sql);

$fks = [];
while ($row = $result->fetch_assoc()) {
    $fks[] = $row;
}

if (empty($fks)) {
    echo "No explicit foreign keys found.";
} else {
    foreach ($fks as $fk) {
        echo "Found FK: {$fk['CONSTRAINT_NAME']} on table {$fk['TABLE_NAME']}\n";
        $drop_sql = "ALTER TABLE {$fk['TABLE_NAME']} DROP FOREIGN KEY {$fk['CONSTRAINT_NAME']}";
        if ($conn->query($drop_sql)) {
            echo "Dropped FK {$fk['CONSTRAINT_NAME']}\n";
        } else {
            echo "Failed to drop FK {$fk['CONSTRAINT_NAME']}: " . $conn->error . "\n";
        }
    }
}
$conn->close();
?>
