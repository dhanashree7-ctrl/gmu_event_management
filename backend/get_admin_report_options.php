<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql    = "SELECT EVENT_ID AS id, EVENT_TITLE AS event_title, START_DATE AS event_date FROM event_master ORDER BY START_DATE DESC";
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Query failed: ' . $conn->error]);
    exit;
}

$events = [];
$academic_years = [];

while ($row = $result->fetch_assoc()) {
    $date = $row['event_date'];
    $year_str = 'Unknown';
    if ($date) {
        $timestamp = strtotime($date);
        $month = (int)date('n', $timestamp);
        $year = (int)date('Y', $timestamp);
        
        if ($month >= 8) {
            $year_str = $year . '-' . ($year + 1);
        } else {
            $year_str = ($year - 1) . '-' . $year;
        }
    }
    
    $events[] = [
        'id' => $row['id'],
        'title' => $row['event_title'],
        'academic_year' => $year_str
    ];
    
    if ($year_str !== 'Unknown' && !in_array($year_str, $academic_years)) {
        $academic_years[] = $year_str;
    }
}

// Sort academic years descending
rsort($academic_years);

// Fetch hierarchy (Faculty -> School -> Department)
$hierarchy_query = "SELECT DISTINCT FACULTY, SCHOOL, DEPT FROM users WHERE DEPT IS NOT NULL AND DEPT != ''";
$hierarchy_result = $conn->query($hierarchy_query);

$hierarchy = [];
$departments = []; // Keep flat list of all departments for backwards compatibility if needed

if ($hierarchy_result) {
    while ($r = $hierarchy_result->fetch_assoc()) {
        $fac = $r['FACULTY'];
        $sch = $r['SCHOOL'];
        $dep = $r['DEPT'];
        
        if (empty($fac) || empty($sch)) {
            continue; // Remove the Unknown Faculty / School tags entirely
        }

        if (strtolower($fac) === 'administration' || strtolower($sch) === 'administration') {
            continue; // Exclude non-academic departments/schools
        }
        
        if (!isset($hierarchy[$fac])) {
            $hierarchy[$fac] = [];
        }
        if (!isset($hierarchy[$fac][$sch])) {
            $hierarchy[$fac][$sch] = [];
        }
        if (!in_array($dep, $hierarchy[$fac][$sch])) {
            $hierarchy[$fac][$sch][] = $dep;
        }
        
        if (!in_array($dep, $departments)) {
            $departments[] = $dep;
        }
    }
}
sort($departments);

echo json_encode([
    'success' => true,
    'data' => [
        'academic_years' => $academic_years,
        'events' => $events,
        'departments' => $departments,
        'hierarchy' => $hierarchy
    ]
]);

$conn->close();
?>
