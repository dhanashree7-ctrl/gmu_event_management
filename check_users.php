<?php
require 'backend/config/db.php';
$c = get_db_connection();
$r = $c->query("SELECT * FROM users");
while($row = $r->fetch_assoc()) {
    print_r($row);
}
