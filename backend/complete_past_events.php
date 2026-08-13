<?php
require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();

$today = date('Y-m-d');

// Move published events whose start date has passed to 'pending_report'
$sql  = "UPDATE event_master SET CURRENT_STATUS = 'pending_report' WHERE CURRENT_STATUS IN ('published', 'approved') AND START_DATE < ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $today);
$stmt->execute();
$affected = $stmt->affected_rows;
$stmt->close();

echo "Successfully marked $affected past events as 'pending_report'.\n";
$conn->close();
?>
