<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

function getUserId($usn) {
    global $conn;
    $stmt = $conn->prepare("SELECT id FROM users WHERE usn_or_emp_id = ?");
    $stmt->bind_param("s", $usn);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) return $row['id'];
    return 1;
}

$fac_cse_id = getUserId('FAC_CSE') ?? 39;
$hod_cse_id = getUserId('HOD_CSE') ?? 38;
$dir_sa_id = getUserId('DIRSA001') ?? 3;

$events = [
    // 3 Completed Events
    [
        'title' => 'Annual Tech Symposium 2025', 'desc' => 'A university-wide technical symposium featuring project showcases.',
        'dept' => 'CSE', 'cat' => 'Academic', 'scale' => 'university', 'status' => 'completed',
        'date' => '2025-05-10', 'start' => '09:00:00', 'end' => '17:00:00', 'venue' => 'Main Auditorium',
        'creator' => $hod_cse_id, 'route' => '["hod", "dean", "pro_vc", "vc"]',
        'history' => '[{"role":"hod","status":"approved","timestamp":"2025-04-01 10:00:00","user_id":'.$hod_cse_id.'}]'
    ],
    [
        'title' => 'Cultural Fest - Sparks', 'desc' => 'State level cultural fest with music and dance performances.',
        'dept' => 'Student Affairs', 'cat' => 'Cultural', 'scale' => 'state', 'status' => 'completed',
        'date' => '2025-11-20', 'start' => '10:00:00', 'end' => '22:00:00', 'venue' => 'University Open Ground',
        'creator' => $dir_sa_id, 'route' => '["hod", "director", "dean", "pro_vc", "vc"]',
        'history' => '[]'
    ],
    [
        'title' => 'Guest Lecture on AI Innovations', 'desc' => 'Expert talk on AI trends by industry leaders.',
        'dept' => 'AIML', 'cat' => 'Academic', 'scale' => 'department', 'status' => 'completed',
        'date' => '2026-02-15', 'start' => '14:00:00', 'end' => '16:00:00', 'venue' => 'Seminar Hall A',
        'creator' => $fac_cse_id, 'route' => '["hod"]',
        'history' => '[]'
    ],
    
    // Pending Events for Dashboards
    [
        'title' => 'National Hackathon 2026', 'desc' => '36-hour coding marathon.',
        'dept' => 'CSE', 'cat' => 'Academic', 'scale' => 'national', 'status' => 'pending',
        'date' => '2026-09-10', 'start' => '08:00:00', 'end' => '20:00:00', 'venue' => 'Innovation Lab',
        'creator' => $fac_cse_id, 'route' => '["hod", "director", "dean", "pro_vc", "vc"]',
        'history' => '[]'
    ],
    [
        'title' => 'Inter-School Sports Meet', 'desc' => 'Annual sports competition between schools.',
        'dept' => 'Student Affairs', 'cat' => 'Sports', 'scale' => 'university', 'status' => 'pending_dean',
        'date' => '2026-09-25', 'start' => '07:00:00', 'end' => '18:00:00', 'venue' => 'Sports Complex',
        'creator' => $dir_sa_id, 'route' => '["hod", "dean", "pro_vc", "vc"]',
        'history' => '[{"role":"hod","status":"approved","timestamp":"2026-08-10 10:00:00","user_id":'.$dir_sa_id.'}]'
    ],
    [
        'title' => 'Blockchain Workshop', 'desc' => 'Hands-on workshop on smart contracts.',
        'dept' => 'CSE', 'cat' => 'Academic', 'scale' => 'faculty', 'status' => 'published',
        'date' => '2026-10-05', 'start' => '10:00:00', 'end' => '13:00:00', 'venue' => 'Computer Lab 3',
        'creator' => $hod_cse_id, 'route' => '["hod", "director"]',
        'history' => '[{"role":"hod","status":"approved","timestamp":"2026-08-11 10:00:00","user_id":'.$hod_cse_id.'}]'
    ]
];

foreach ($events as $idx => $ev) {
    $event_id_str = 'EVT-SEED-' . time() . '-' . $idx;
    
    $sql = "INSERT INTO event_master 
            (EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, CURRENT_STATUS, EVENT_SCALE) 
            VALUES (?, ?, ?, 'Workshop', 'offline', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssssssssiss', 
        $event_id_str, $ev['dept'], $ev['cat'], $ev['title'], $ev['desc'], 
        $ev['date'], $ev['date'], $ev['start'], $ev['end'], $ev['venue'], 
        $ev['creator'], $ev['status'], $ev['scale']
    );
    $stmt->execute();
    $insert_id = $stmt->insert_id;
    
    $meta_sql = "INSERT INTO event_metadata (EVENT_ID, APPROVAL_ROUTE, APPROVAL_HISTORY_JSON, MAX_PARTICIPANTS, BUDGET, DETAILS_JSON) 
                 VALUES (?, ?, ?, 100, 5000, '{}')";
    $mstmt = $conn->prepare($meta_sql);
    $mstmt->bind_param('iss', $insert_id, $ev['route'], $ev['history']);
    $mstmt->execute();
    
    if ($ev['status'] === 'completed') {
        for ($i=1; $i<=3; $i++) {
            $student_id = 'GMU26CS03' . $i; // Ensure this user exists or the code might fail if foreign key is strict. But I'll use real USN if I can.
            // Actually, I'll use known USNs from earlier: 'GMBCAT01', 'GMBCDA01', 'GMBCAI01'
            $students = ['GMBCAT01', 'GMBCDA01', 'GMBCAI01'];
            $st_usn = $students[$i-1];
            
            $reg_sql = "INSERT INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, ATTENDED, CHECK_IN_STATUS, REGISTRATION_DATE) 
                        VALUES (?, ?, 'active', 'participant', 1, 'checked_in', '2025-01-01 10:00:00')";
            $rstmt = $conn->prepare($reg_sql);
            $rstmt->bind_param('si', $st_usn, $insert_id);
            $rstmt->execute();
        }
    }
}
echo "Seeded " . count($events) . " events successfully.\n";
