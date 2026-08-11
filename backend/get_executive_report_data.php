<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// 1. Faculty/School Comparison (Stacked Bar Data)
$fac_sql = "
    SELECT COALESCE(u.school_name, 'Other') AS school_name, 
           COALESCE(u.faculty_name, 'Other') AS faculty_name, 
           COUNT(em.SL_NO) as event_count 
    FROM event_master em 
    JOIN users u ON em.CREATED_BY = u.id 
    GROUP BY school_name, faculty_name
";
$fac_res = $conn->query($fac_sql);

$faculty_comparison = [];
$faculties = []; // Keep track of all unique faculties for Recharts Keys
while ($row = $fac_res->fetch_assoc()) {
    $school = $row['school_name'];
    $faculty = $row['faculty_name'];
    $count = (int)$row['event_count'];
    
    if (!isset($faculty_comparison[$school])) {
        $faculty_comparison[$school] = ['school_name' => $school];
    }
    $faculty_comparison[$school][$faculty] = $count;
    
    if (!in_array($faculty, $faculties)) {
        $faculties[] = $faculty;
    }
}
// Convert to array of objects
$faculty_comparison_data = array_values($faculty_comparison);

// 2. Budget vs Scale (Scatter Plot Data)
$scatter_sql = "
    SELECT em.EVENT as event_name, emd.BUDGET as budget, 
           SUM(CASE WHEN er.CHECK_IN_STATUS = 'checked_in' THEN 1 ELSE 0 END) as checked_in_count
    FROM event_master em
    JOIN event_metadata emd ON em.SL_NO = emd.EVENT_ID
    LEFT JOIN event_registrations er ON em.SL_NO = er.EVENT_ID
    WHERE emd.BUDGET > 0
    GROUP BY em.SL_NO
";
$scatter_res = $conn->query($scatter_sql);

$budget_vs_scale = [];
while ($row = $scatter_res->fetch_assoc()) {
    $budget = (float)$row['budget'];
    $checked_in = (int)$row['checked_in_count'];
    
    $budget_vs_scale[] = [
        'event_name' => $row['event_name'],
        'budget' => $budget,
        'checked_in' => $checked_in
    ];
}

// 3. Internal vs External Reach (Pie Chart Data)
$reach_sql = "SELECT details_json FROM event_registrations";
$reach_res = $conn->query($reach_sql);

$internal = 0;
$external = 0;

while ($row = $reach_res->fetch_assoc()) {
    $is_external = false;
    if (!empty($row['details_json'])) {
        $json = json_decode($row['details_json'], true);
        if ($json && is_array($json)) {
            foreach ($json as $k => $v) {
                $kl = strtolower((string)$k);
                if ($kl === 'college' || $kl === 'college_name' || $kl === 'university' || $kl === 'institution') {
                    $val = strtolower((string)$v);
                    if (strpos($val, 'gm university') === false && strpos($val, 'gmu') === false && strpos($val, 'gm institute') === false) {
                        $is_external = true;
                        break;
                    }
                }
            }
        }
    }
    
    if ($is_external) {
        $external++;
    } else {
        $internal++;
    }
}

$conn->close();

echo json_encode([
    'success' => true,
    'data' => [
        'faculty_comparison' => [
            'data' => $faculty_comparison_data,
            'faculties' => $faculties
        ],
        'budget_vs_scale' => $budget_vs_scale,
        'reach' => [
            ['name' => 'Internal (GMU)', 'count' => $internal],
            ['name' => 'External', 'count' => $external]
        ]
    ]
]);
?>
