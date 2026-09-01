<?php
require_once __DIR__ . '/fcm_helper.php';
$token = 'exwE3ZxmlK4is8aL9wDHt7:APA91bHM8wQhvrjDO7sZWcMiao0_sLCvOHVCtrwRBy96GN21qw7dAnHJDxRdsMl8MMFUkwX5mSV2GyQoEme9SQPWNwqHf8p3WcsbYvUT0K4Op91b965KaLE';
$res = send_fcm_notification($token, 'Test', 'Test message', '/');
var_dump($res);
