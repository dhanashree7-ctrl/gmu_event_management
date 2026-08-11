<?php
$data = json_encode(['department_name' => 'AIML']);
$opts = ['http' => ['method' => 'POST', 'header' => 'Content-Type: application/json', 'content' => $data]];
$context = stream_context_create($opts);
$res = file_get_contents('http://localhost:8080/backend/get_hod_approved_events.php', false, $context);
print_r($res);
