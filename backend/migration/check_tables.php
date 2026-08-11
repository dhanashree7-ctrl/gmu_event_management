<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();
$res = $conn->query("SHOW TABLES");
echo "DB connected. Tables in " . DB_NAME . ":\n";
while ($r = $res->fetch_row()) echo " - " . $r[0] . "\n";
$conn->close();
?>
