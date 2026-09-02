<?php
$baseUrl = 'http://localhost:8080/backend';

function api_call($endpoint, $payload, $token = null, $isMultipart = false) {
    global $baseUrl;
    $ch = curl_init("$baseUrl/$endpoint");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    
    $headers = [];
    if (!$isMultipart) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    
    if ($token) {
        $headers[] = "Authorization: Bearer $token";
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $httpCode, 'body' => json_decode($response, true) ?: $response];
}

echo "1. Login as csfac01\n";
$res = api_call('login.php', ['username' => 'csfac01', 'password' => 'test1234']);
$facToken = $res['body']['token'];
echo "Token: $facToken\n\n";

echo "2. Propose Event\n";
$eventPayload = [
    'event_title' => 'cs and robotics workshop',
    'description' => 'Test event for end to end simulation',
    'category' => 'Academic',
    'event_scale' => 'university',
    'event_mode' => 'Offline',
    'venue' => 'Main Lab',
    'event_date' => '2026-10-10',
    'start_time' => '10:00',
    'end_time' => '12:00',
    'registration_date' => '2026-10-09',
    'max_participants' => 100,
    'budget' => 500,
    'coordinator_name' => 'Dr. Bob',
    'coordinator_number' => '1234567890',
    'brochure' => new CURLFile(__DIR__ . '/dummy.pdf', 'application/pdf', 'dummy.pdf')
];

$res = api_call('create_event.php', $eventPayload, $facToken, true);
if (!$res['body']['success']) { die("Failed to create event: " . json_encode($res['body']) . "\n"); }
$eventId = $res['body']['event_id'];
echo "Event Created! ID: $eventId\n\n";

$roles = [
    'cshod01' => 'HOD',
    'dean.fet@gmu.ac.in' => 'DEAN',
    'pro-vc@gmu.ac.in' => 'PRO_VC',
    'vc@gmu.ac.in' => 'VC'
];

foreach ($roles as $username => $roleName) {
    echo "3. Login as $roleName ($username)\n";
    $res = api_call('login.php', ['username' => $username, 'password' => 'test1234']);
    if (!$res['body']['success']) { die("Failed to login as $username\n"); }
    $token = $res['body']['token'];
    
    echo "   Approving Event $eventId...\n";
    $res = api_call('update_event_status.php', [
        'event_id' => $eventId,
        'action' => 'approve',
        'remarks' => "$roleName Approved"
    ], $token);
    
    echo "   Response: " . json_encode($res['body']) . "\n\n";
    if (!isset($res['body']['success']) || !$res['body']['success']) {
        die("Approval failed at $roleName step!\n");
    }
}

echo "4. Login as Student (U23C01CA018)\n";
$res = api_call('login.php', ['username' => 'U23C01CA018', 'password' => 'test1234']);
$stuToken = $res['body']['token'];

echo "   Registering for Event...\n";
$res = api_call('register_for_event.php', [
    'event_id' => $eventId,
    'DESIGNATION' => 'participant'
], $stuToken);
echo "   Response: " . json_encode($res['body']) . "\n\n";

echo "ALL TESTS PASSED!\n";
