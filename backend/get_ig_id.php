<?php
require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();
$res  = $conn->query("SELECT SL_NO AS ID FROM event_master WHERE EVENT = 'Ignitron 2026' LIMIT 1");
$row  = $res->fetch_assoc();
echo $row['ID'];
?>
