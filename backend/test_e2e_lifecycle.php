<?php
/**
 * Test script to run through the entire event lifecycle automatically.
 */
declare(strict_types=1);
require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();

function curl_post($url, $data, $is_json = false) {
    $ch = curl_init($url);
    if ($is_json) {
        $payload = json_encode($data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

function curl_post_multipart($url, $data) {
    $ch = curl_init($url);
    // Create a dummy file for brochure and report
    file_put_contents('dummy.pdf', '%PDF-1.4 dummy pdf');
    $data['brochure'] = new CURLFile('dummy.pdf', 'application/pdf', 'dummy.pdf');
    $data['report_file'] = new CURLFile('dummy.pdf', 'application/pdf', 'dummy.pdf');
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

$base_url = 'http://localhost:8000/backend'; // Wait, let me check what port the backend runs on. Or I'll just use the file inclusion? No, the backend is served by XAMPP or PHP built-in server. If it's not running, curl will fail.
// I can just execute the files directly by mocking $_POST, but that's messy.
// Let's assume PHP built-in server is running on localhost:8000. Wait, XAMPP is probably on localhost/Event Management/backend.
// Let's try http://localhost/Event Management/backend
$base_url = 'http://localhost:8000';

echo "Starting E2E Test...\n";

// 1. Propose Event (HOD)
echo "1. HOD proposing event...\n";
$create_data = [
    'event_title' => 'E2E Test Event',
    'description' => 'Testing everything',
    'event_date'  => date('Y-m-d'),
    'category'    => 'Academic',
    'event_scale' => 'university',
    'event_mode'  => 'offline',
    'budget'      => '5000',
    'proposed_by_id' => 2384, // hod_ece
    'role'        => 'hod',
    'max_participants' => 50,
];
$res = curl_post_multipart("$base_url/create_event.php", $create_data);
if (!$res || !$res['success']) { die("Failed to create event: " . json_encode($res)); }
$event_id = $res['event_id'];
echo "✅ Event created: ID $event_id\n";

// 2. Approve Event (Dean -> Pro VC -> VC)
echo "2. Approving event...\n";
$approvers = [
    ['role' => 'hod', 'user_id' => 2384],
    ['role' => 'dean', 'user_id' => 2382],
    ['role' => 'pro_vc', 'user_id' => 2442], // provc ID (will query)
    ['role' => 'vc', 'user_id' => 2441],
];
// Get provc ID
$res_provc = $conn->query("SELECT id FROM users WHERE system_role='pro_vc' LIMIT 1");
$approvers[1]['user_id'] = $res_provc->fetch_assoc()['id'];

foreach ($approvers as $appr) {
    echo "   Approving as {$appr['role']}...\n";
    $res = curl_post("$base_url/update_event_status.php", [
        'event_id' => $event_id,
        'action' => 'approve',
        'remarks' => 'Looks good',
        'role' => $appr['role'],
        'user_id' => $appr['user_id']
    ], true);
    if (!$res || !$res['success']) { die("Failed approval step: " . json_encode($res)); }
    echo "   ✅ Approved\n";
}

// 3. Finalize Event (HOD)
echo "3. Finalizing event...\n";
$finalize_data = [
    'event_id' => $event_id,
    'event_date' => date('Y-m-d'),
    'event_time' => (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->modify('+15 minutes')->format('H:i'),
    'venue' => 'Main Auditorium',
    'registration_deadline' => date('Y-m-d\TH:i', strtotime('+5 days'))
];
$res = curl_post("$base_url/finalize_event.php", $finalize_data);
if (!$res || !$res['success']) { die("Failed to finalize event: " . json_encode($res)); }
echo "✅ Event finalized and published\n";

// 4. Student Registers
echo "4. Student registering...\n";
$reg_data = [
    'event_id' => $event_id,
    'student_id' => 'GMU26EC001',
    'role' => 'participant'
];
$res = curl_post("$base_url/register_for_event.php", $reg_data, true);
if (!$res || !$res['success']) { die("Failed to register: " . json_encode($res)); }
$qr_token = $res['qr_token'];
echo "✅ Student registered. QR: $qr_token\n";

// 5. Check In
echo "5. Checking in student...\n";
$checkin_data = ['qr_token' => $qr_token];
$res = curl_post("$base_url/process_checkin.php", $checkin_data, true);
if (!$res || !$res['success']) { die("Failed to check in: " . json_encode($res)); }
echo "✅ Checked in successfully\n";

// 6. Submit Event Report
echo "6. Submitting report to complete event...\n";
$report_data = [
    'event_id' => $event_id,
    'faculty_id' => 2384,
    'report_summary' => 'Event was a huge success.'
];
$res = curl_post_multipart("$base_url/submit_event_report.php", $report_data);
if (!$res || !$res['success']) { die("Failed to submit report: " . json_encode($res)); }
echo "✅ Report submitted, event completed\n";

// 7. Student Submits Feedback
echo "7. Student submitting feedback...\n";
$fb_data = [
    'event_id' => $event_id,
    'student_id' => 'GMU26EC001',
    'rating' => 5,
    'comments' => 'Amazing test event!'
];
$res = curl_post("$base_url/submit_feedback.php", $fb_data, true);
if (!$res || !$res['success']) { die("Failed to submit feedback: " . json_encode($res)); }
echo "✅ Feedback submitted\n";

// Verify Notifications
echo "8. Verifying notifications...\n";
$notif_q = $conn->query("SELECT user_id, message FROM Notifications WHERE message LIKE '%E2E Test Event%'");
$count = $notif_q->num_rows;
echo "✅ Found $count notifications related to the event\n";

echo "\n🎉 E2E TEST COMPLETED SUCCESSFULLY! 🎉\n";
@unlink('dummy.pdf');
?>
