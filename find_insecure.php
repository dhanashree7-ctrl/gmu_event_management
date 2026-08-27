<?php
$files = glob('c:/Event Management/backend/*.php');
foreach($files as $file) {
    $content = file_get_contents($file);
    if (strpos($content, 'require_auth') === false) {
        if (strpos($content, '$_GET[\'user_id\']') !== false || strpos($content, 'INPUT_GET, \'user_id\'') !== false || strpos($content, 'role') !== false || strpos($content, 'department') !== false) {
            echo basename($file) . PHP_EOL;
        }
    }
}
