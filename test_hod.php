<?php
require_once __DIR__ . '/backend/config/db.php';
$conn = get_db_connection();
$sql = "SELECT e.id, e.event_title, e.current_status, u.name, u.department_name FROM EventsMaster e JOIN users u ON e.proposed_by_id = u.id;";
$result = $conn->query($sql);
while($row = $result->fetch_assoc()) {
    print_r($row);
}
