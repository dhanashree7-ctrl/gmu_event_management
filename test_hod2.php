<?php
require 'backend/config/db.php';
$conn = get_db_connection();
$res = $conn->query('SELECT id, username, role, department_name FROM users');
while($r = $res->fetch_assoc()) print_r($r);
