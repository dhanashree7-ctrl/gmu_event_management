<?php
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); } catch (Exception $e) { die("DB Error"); }

$roles_to_seed = ['vc', 'pro_vc', 'dean'];

// We need a faculty user to propose these
$fac_res = $conn->query("SELECT id, department FROM users WHERE system_role = 'faculty' LIMIT 1");
$fac = $fac_res->fetch_assoc();
$fac_id = $fac['id'] ?? 1;
$fac_dept = $fac['department'] ?? 'CSE';

foreach ($roles_to_seed as $role) {
    // 1. Add some Pending Events for this role
    $status_pending = 'pending_' . $role;
    
    $pending_events = [
        [
            'title' => strtoupper($role) . ' Annual Planning ' . rand(100, 999),
            'desc' => 'High-level planning event requiring ' . $role . ' approval.',
            'date' => '2026-10-' . rand(10, 28),
            'cat' => 'Academic',
            'status' => $status_pending,
            'scale' => 'university',
            'budget' => rand(100000, 500000)
        ],
        [
            'title' => strtoupper($role) . ' Networking Mixer ' . rand(100, 999),
            'desc' => 'Networking event across multiple faculties.',
            'date' => '2026-11-' . rand(10, 28),
            'cat' => 'University',
            'status' => $status_pending,
            'scale' => 'university',
            'budget' => rand(50000, 150000)
        ]
    ];

    foreach ($pending_events as $e) {
        $stmt = $conn->prepare("INSERT INTO event_master (EVENT, DESCRIPTION, START_DATE, END_DATE, CATEGORY, TYPE, MODE, CREATED_BY, DEPARTMENT, CURRENT_STATUS, EVENT_SCALE) VALUES (?, ?, ?, ?, ?, 'Event', 'offline', ?, ?, ?, ?)");
        $stmt->bind_param("ssssssiss", $e['title'], $e['desc'], $e['date'], $e['date'], $e['cat'], $fac_id, $fac_dept, $e['status'], $e['scale']);
        $stmt->execute();
        $eid = $stmt->insert_id;
        
        $meta = $conn->prepare("INSERT INTO event_metadata (EVENT_ID, BUDGET, APPROVAL_HISTORY_JSON) VALUES (?, ?, '[]')");
        $meta->bind_param("id", $eid, $e['budget']);
        $meta->execute();
    }

    // 2. Add some Approved Events by this role
    $approved_events = [
        [
            'title' => strtoupper($role) . ' Funded Research Seminar ' . rand(100, 999),
            'desc' => 'Seminar showcasing new research.',
            'date' => '2026-09-' . rand(10, 28),
            'cat' => 'Academic',
            'status' => 'published',
            'scale' => 'university',
            'budget' => rand(200000, 800000)
        ],
        [
            'title' => strtoupper($role) . ' Endorsed Workshop ' . rand(100, 999),
            'desc' => 'Workshop previously approved by ' . $role . '.',
            'date' => '2026-12-' . rand(10, 28),
            'cat' => 'Workshop',
            'status' => 'published',
            'scale' => 'university',
            'budget' => rand(10000, 50000)
        ]
    ];

    $exec_res = $conn->prepare("SELECT id, full_name, system_role FROM users WHERE system_role = ? LIMIT 1");
    $exec_res->bind_param("s", $role);
    $exec_res->execute();
    $exec = $exec_res->get_result()->fetch_assoc();
    
    $exec_id = $exec['id'] ?? 10;
    $exec_name = $exec['full_name'] ?? strtoupper($role);
    $exec_role = $exec['system_role'] ?? $role;

    $approval_hist = json_encode([
        [
            'role' => $exec_role,
            'user_id' => $exec_id,
            'name' => $exec_name,
            'action' => 'approve',
            'remarks' => 'Approved, excellent initiative.',
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
}

echo "Seeded events for vc, pro_vc, and dean successfully.";
$conn->close();
?>
