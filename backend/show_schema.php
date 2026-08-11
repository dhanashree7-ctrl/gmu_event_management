<?php
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); } catch (Exception $e) { die("DB Error"); }
$res = $conn->query("SHOW CREATE TABLE event_master");
if ($row = $res->fetch_assoc()) {
    echo $row['Create Table'];
}
$conn->close();
?>
