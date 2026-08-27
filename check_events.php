<?php
require 'backend/config/db.php';
$c = get_db_connection();
$r = $c->query("SELECT EVENT_ID, EVENT_TITLE, PROPOSER_ID, CURRENT_STATUS FROM event_master");
while($row = $r->fetch_assoc()) {
    print_r($row);
}
