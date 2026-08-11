<?php
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); } catch (Exception $e) { die("DB Error"); }

// 1. Add some Pending Director Events
$events = [
    [
        'title' => 'Annual Tech Symposium 2026',
        'desc' => 'A large scale tech event requiring director approval.',
        'date' => '2026-10-15',
        'cat' => 'Academic',
        'status' => 'pending_director',
        'scale' => 'university',
        'budget' => 150000
    ],
    [
        'title' => 'International Guest Lecture',
        'desc' => 'Guest lecture by industry experts.',
        'date' => '2026-09-20',
        'cat' => 'Academic',
        'status' => 'pending_director',
        'scale' => 'department',
        'budget' => 50000
    ],
    [
        'title' => 'Cultural Fest - Prelims',
        'desc' => 'Initial rounds of the university cultural festival.',
        'date' => '2026-11-05',
        'cat' => 'Cultural',
        'status' => 'pending_director',
        'scale' => 'university',
        'budget' => 200000
    ]
];

// We need a faculty user to propose these
$fac_res = $conn->query("SELECT id, department FROM users WHERE system_role = 'faculty' LIMIT 1");
$fac = $fac_res->fetch_assoc();
$fac_id = $fac['id'] ?? 1;
$fac_dept = $fac['department'] ?? 'CSE';

foreach ($events as $e) {
    $stmt = $conn->prepare("INSERT INTO event_master (EVENT, DESCRIPTION, START_DATE, END_DATE, CATEGORY, TYPE, MODE, CREATED_BY, DEPARTMENT, CURRENT_STATUS, EVENT_SCALE) VALUES (?, ?, ?, ?, ?, 'Event', 'offline', ?, ?, ?, ?)");
    $stmt->bind_param("ssssssiss", $e['title'], $e['desc'], $e['date'], $e['date'], $e['cat'], $fac_id, $fac_dept, $e['status'], $e['scale']);
    $stmt->execute();
    $eid = $stmt->insert_id;
    
    $meta = $conn->prepare("INSERT INTO event_metadata (EVENT_ID, BUDGET, APPROVAL_HISTORY_JSON) VALUES (?, ?, '[]')");
    $meta->bind_param("id", $eid, $e['budget']);
    $meta->execute();
}

// 2. Add some Approved by Director Events
$approved_events = [
    [
        'title' => 'Coding Bootcamp Workshop',
        'desc' => 'Intensive weekend bootcamp for juniors.',
        'date' => '2026-08-25',
        'cat' => 'Academic',
        'status' => 'published',
        'scale' => 'department',
        'budget' => 15000
    ],
    [
        'title' => 'Inter-College Sports Meet',
        'desc' => 'Hosting multiple colleges for a sports event.',
        'date' => '2026-09-10',
        'cat' => 'Sports',
        'status' => 'published',
        'scale' => 'university',
        'budget' => 350000
    ]
];

$dir_res = $conn->query("SELECT id, full_name, system_role FROM users WHERE system_role = 'director' LIMIT 1");
$dir = $dir_res->fetch_assoc();
$dir_id = $dir['id'] ?? 2;
$dir_name = $dir['full_name'] ?? 'Director';
$dir_role = $dir['system_role'] ?? 'director';

$approval_hist = json_encode([
    [
        'role' => $dir_role,
        'user_id' => $dir_id,
        'name' => $dir_name,
        'action' => 'approve',
        'remarks' => 'Approved, looks good.',
        'timestamp' => date('Y-m-d H:i:s')
    ]
]);

foreach ($approved_events as $e) {
    $stmt = $conn->prepare("INSERT INTO event_master (EVENT, DESCRIPTION, START_DATE, END_DATE, CATEGORY, TYPE, MODE, CREATED_BY, DEPARTMENT, CURRENT_STATUS, EVENT_SCALE) VALUES (?, ?, ?, ?, ?, 'Event', 'offline', ?, ?, ?, ?)");
    $stmt->bind_param("ssssssiss", $e['title'], $e['desc'], $e['date'], $e['date'], $e['cat'], $fac_id, $fac_dept, $e['status'], $e['scale']);
    $stmt->execute();
    $eid = $stmt->insert_id;
    
    $meta = $conn->prepare("INSERT INTO event_metadata (EVENT_ID, BUDGET, APPROVAL_HISTORY_JSON) VALUES (?, ?, ?)");
    $meta->bind_param("ids", $eid, $e['budget'], $approval_hist);
    $meta->execute();
}

echo "Seeded director events successfully.";
$conn->close();
?>
