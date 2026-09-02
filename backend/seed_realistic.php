<?php
/**
 * Realistic Seeder for GMU Event Management
 */

require_once __DIR__ . '/config/db.php';
$conn = get_db_connection();

echo "Truncating old data...\n";
$conn->query("SET FOREIGN_KEY_CHECKS = 0;");
$conn->query("TRUNCATE TABLE event_master;");
$conn->query("TRUNCATE TABLE event_registrations;");
$conn->query("SET FOREIGN_KEY_CHECKS = 1;");

$proposer_id = 'csfac01';
$dummy_brochure = 'uploads/event_brochure_dummy.pdf';
$dummy_report = 'uploads/event_report_dummy.pdf';

if (!file_exists(__DIR__ . '/uploads')) mkdir(__DIR__ . '/uploads', 0777, true);
file_put_contents(__DIR__ . '/' . $dummy_brochure, 'Dummy Brochure Content');
file_put_contents(__DIR__ . '/' . $dummy_report, 'Dummy Report Content');

$events = [
    [
        'title' => 'Global Tech Symposium 2026',
        'desc' => 'A premier tech gathering featuring keynotes from industry leaders, panel discussions on AI, and networking sessions.',
        'cat' => 'Academic', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'Main Auditorium',
        'start' => '2026-08-10', 'end' => '2026-08-11', 'time' => '09:00:00', 'status' => 'completed',
        'is_festival' => false
    ],
    [
        'title' => 'Cultural Fest - Milan 2026',
        'desc' => 'The annual cultural extravaganza of GM University! Dance, music, art, and drama competitions.',
        'cat' => 'Cultural', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'Open Air Theatre',
        'start' => '2026-08-15', 'end' => '2026-08-16', 'time' => '17:00:00', 'status' => 'completed',
        'is_festival' => true,
        'sub_events' => ['Battle of Bands', 'Solo Dance', 'Face Painting', 'Fashion Show']
    ],
    [
        'title' => 'AI & Robotics Bootcamp',
        'desc' => 'A hands-on intensive bootcamp on building intelligent robotics systems using ROS and Python.',
        'cat' => 'Academic', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'Robotics Lab',
        'start' => '2026-09-20', 'end' => '2026-09-22', 'time' => '10:00:00', 'status' => 'published',
        'is_festival' => false
    ],
    [
        'title' => 'Inter-Collegiate Football Tournament',
        'desc' => 'Knockout tournament for football teams across the state. Huge cash prizes to be won!',
        'cat' => 'Sports', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'University Stadium',
        'start' => '2026-10-05', 'end' => '2026-10-07', 'time' => '08:00:00', 'status' => 'published',
        'is_festival' => true,
        'sub_events' => ['Men Football', 'Women Football']
    ],
    [
        'title' => 'Cybersecurity Hackathon 24h',
        'desc' => 'Capture the flag and defend your infrastructure. 24 hours of non-stop hacking.',
        'cat' => 'Academic', 'scale' => 'department', 'mode' => 'Online', 'venue' => 'Discord Server',
        'start' => '2026-07-01', 'end' => '2026-07-02', 'time' => '12:00:00', 'status' => 'completed',
        'is_festival' => false
    ],
    [
        'title' => 'Guest Lecture: Quantum Computing',
        'desc' => 'Eminent scientist Dr. Feynman will introduce the fundamentals of Quantum Information Theory.',
        'cat' => 'Academic', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'Seminar Hall A',
        'start' => '2026-10-15', 'end' => '2026-10-15', 'time' => '14:00:00', 'status' => 'pending_dean',
        'is_festival' => false
    ],
    [
        'title' => 'Annual Sports Meet 2026',
        'desc' => 'Track and field events, relay races, and more to celebrate the athletic spirit of GMU.',
        'cat' => 'Sports', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'University Stadium',
        'start' => '2026-11-01', 'end' => '2026-11-03', 'time' => '07:00:00', 'status' => 'published',
        'is_festival' => true,
        'sub_events' => ['100m Sprint', 'Long Jump', 'Relay 4x100m']
    ],
    [
        'title' => 'Photography Exhibition',
        'desc' => 'Showcasing the best clicks from our student body. Theme: Nature and Concrete.',
        'cat' => 'Cultural', 'scale' => 'university', 'mode' => 'Offline', 'venue' => 'Art Gallery',
        'start' => '2026-05-10', 'end' => '2026-05-12', 'time' => '10:00:00', 'status' => 'completed',
        'is_festival' => false
    ],
    [
        'title' => 'Faculty Development Program on Web3',
        'desc' => 'Training program for university faculty on blockchain, smart contracts and decentralization.',
        'cat' => 'Academic', 'scale' => 'university', 'mode' => 'Online', 'venue' => 'Zoom',
        'start' => '2026-11-20', 'end' => '2026-11-25', 'time' => '16:00:00', 'status' => 'pending_vc',
        'is_festival' => false
    ],
    [
        'title' => 'Department Debate Competition',
        'desc' => 'CSE students battle it out on topics of Tech Ethics and AI dominance.',
        'cat' => 'Cultural', 'scale' => 'department', 'mode' => 'Offline', 'venue' => 'Room 404',
        'start' => '2026-09-30', 'end' => '2026-09-30', 'time' => '15:00:00', 'status' => 'published',
        'is_festival' => false
    ]
];

// Fetch some real student IDs from users table
$student_res = $conn->query("SELECT USER_NAME, NAME FROM users WHERE DESIGNATION = 'STUDENT' LIMIT 20");
$students = [];
while ($row = $student_res->fetch_assoc()) {
    $students[] = $row;
}

$stmt_event = $conn->prepare("INSERT INTO event_master (PROPOSER_ID, EVENT_TITLE, DESCRIPTION, CATEGORY, SCALE, MODE, VENUE, START_DATE, END_DATE, START_TIME, END_TIME, REGISTRATION_DEADLINE, MAX_PARTICIPANTS, BUDGET, COORDINATOR_NAME, CORDINATOR_CONTACT, ATTACHMENTS, CURRENT_STATUS, NOTIFICATION_SENT, APPROVAL_WORKFLOW) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$stmt_reg = $conn->prepare("INSERT INTO event_registrations (EVENT_ID, USER_ID, ROLE, REGISTRATION_DATE, QR_CODE, CHECK_IN_STATUS, CHECK_IN_TIME, FEEDBACK_JSON, EXTERNAL_DETAILS, TEAM_LEAD, TEAM_MEMBERS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

$eventIdCounter = 1;
foreach ($events as $e) {
    $attachments = [
        'brochure' => $dummy_brochure,
        'details' => [
            'participation_type' => $e['is_festival'] ? 'team' : 'solo',
            'is_festival' => $e['is_festival']
        ]
    ];
    if (isset($e['sub_events'])) {
        $attachments['details']['sub_events'] = $e['sub_events'];
    }
    if ($e['status'] === 'completed') {
        $attachments['report'] = $dummy_report;
    }
    $attachments_json = json_encode($attachments);
    
    $deadline = date('Y-m-d H:i:s', strtotime($e['start']) - 86400);
    $max_p = rand(50, 200);
    $budget = rand(1000, 10000);
    $c_name = "Prof. John Doe";
    $c_num = "9876543210";
    $workflow = "[]";
    $notif = 1;

    $stmt_event->bind_param("ssssssssssssisssssis", 
        $proposer_id, $e['title'], $e['desc'], $e['cat'], $e['scale'], 
        $e['mode'], $e['venue'], $e['start'], $e['end'], $e['time'], 
        $e['time'], $deadline, $max_p, $budget, $c_name, $c_num, 
        $attachments_json, $e['status'], $notif, $workflow
    );
    $stmt_event->execute();
    $inserted_id = $conn->insert_id;
    echo "Inserted Event: {$e['title']} (ID: $inserted_id)\n";

    // Seed Registrations for this event
    if (in_array($e['status'], ['completed', 'published'])) {
        $num_regs = rand(5, 15);
        shuffle($students);
        
        for ($i = 0; $i < $num_regs; $i++) {
            $stu = $students[$i];
            $role = ($i === 0) ? 'coordinator' : (($i < 3) ? 'volunteer' : 'participant');
            $reg_date = date('Y-m-d H:i:s', strtotime($e['start'] . " -" . rand(2, 10) . " days"));
            
            $check_in_status = ($e['status'] === 'completed') ? (rand(0,10) > 2 ? 'checked_in' : 'pending') : 'pending';
            $check_in_time = ($check_in_status === 'checked_in') ? date('Y-m-d H:i:s', strtotime($e['start'] . ' +30 minutes')) : null;
            $qr = uniqid("EVT-{$inserted_id}-STU-");
            
            $feedback_json = null;
            if ($e['status'] === 'completed' && $check_in_status === 'checked_in' && rand(0,1)) {
                $feedback_json = json_encode([
                    'rating' => rand(4, 5),
                    'comment' => 'Great event! Really enjoyed the sessions.'
                ]);
            }
            
            $ext_details = null;
            $t_lead = null;
            $t_members = null;
            
            if ($e['is_festival']) {
                $joined_subs = [$e['sub_events'][array_rand($e['sub_events'])]];
                if (rand(0,1)) {
                    $ext_details = json_encode([
                        'external_college_name' => rand(0,1) ? 'MIT Manipal' : 'BMS College',
                        'registered_sub_events' => $joined_subs
                    ]);
                } else {
                    $ext_details = json_encode(['registered_sub_events' => $joined_subs]);
                }
                
                if ($i % 3 === 0) { // Make some team leads
                    $t_lead = $stu['NAME'];
                    $t_members = "Student X, Student Y, Student Z";
                }
            } else {
                if (rand(0, 10) > 8) { // occasional external student
                    $ext_details = json_encode(['external_college_name' => 'RV College']);
                }
            }

            $stmt_reg->bind_param("issssssssss", 
                $inserted_id, $stu['USER_NAME'], $role, $reg_date, $qr, 
                $check_in_status, $check_in_time, $feedback_json, 
                $ext_details, $t_lead, $t_members
            );
            $stmt_reg->execute();
        }
        echo "   -> Seeded $num_regs registrations.\n";
    }
}

echo "Seeding Complete!\n";
$conn->close();
