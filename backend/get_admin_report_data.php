<?php
/**
 * backend/get_admin_report_data.php
 * Returns participation metrics joined from event_master + event_registrations + users.
 */
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

$event_id      = isset($_GET['event_id'])      ? $_GET['event_id']      : 'all';
$academic_year = isset($_GET['academic_year']) ? $_GET['academic_year'] : 'all';
$department    = isset($_GET['department']) && $_GET['department'] !== '' ? $_GET['department'] : 'all';
$faculty       = isset($_GET['faculty'])    && $_GET['faculty']    !== '' ? $_GET['faculty']    : 'all';
$school        = isset($_GET['school'])     && $_GET['school']     !== '' ? $_GET['school']     : 'all';

// Fetch master events from event_master
$master_events_query = "
    SELECT em.SL_NO AS id, em.EVENT AS event_title, emd.REPORT_PDF_PATH AS report_pdf_path,
           em.START_DATE AS event_date, em.CATEGORY AS category, em.EVENT_SCALE AS event_scale,
           emd.BUDGET AS budget, em.DEPARTMENT AS department
    FROM event_master em
    LEFT JOIN event_metadata emd ON emd.EVENT_ID = em.SL_NO
";
$master_events_result = $conn->query($master_events_query);

$valid_event_ids = [];
$events_info     = [];

while ($row = $master_events_result->fetch_assoc()) {
    $date     = $row['event_date'];
    $year_str = 'Unknown';
    if ($date) {
        $month    = (int)date('n', strtotime($date));
        $year     = (int)date('Y', strtotime($date));
        $year_str = ($month >= 8) ? "$year-" . ($year + 1) : ($year - 1) . "-$year";
    }
    if ($academic_year !== 'all' && $academic_year !== $year_str) continue;
    if ($event_id !== 'all' && (string)$row['id'] !== (string)$event_id) continue;

    $valid_event_ids[] = $row['id'];
    $events_info[]     = [
        'id'             => $row['id'],
        'event_title'    => $row['event_title'],
        'report_pdf_path'=> $row['report_pdf_path'],
        'category'       => $row['category']    ?? 'N/A',
        'event_scale'    => $row['event_scale']  ?? 'N/A',
        'department'     => $row['department']   ?? 'N/A',
        'budget'         => $row['budget']       ?? '0',
        'average_rating' => 'N/A',
    ];
}

if (empty($valid_event_ids)) {
    echo json_encode([
        'success' => true,
        'data' => [
            'metrics'     => ['total_participants' => 0, 'department_breakdown' => [], 'semester_breakdown' => []],
            'participants' => [],
            'events_info' => [],
        ],
    ]);
    exit;
}

$in_clause = implode(',', array_map('intval', $valid_event_ids));

$participants_query = "
    SELECT
        COALESCE(u.full_name, 'Unknown Participant') AS participant_name,
        COALESCE(u.usn_or_emp_id, er.STUDENT_ID) AS usn,
        COALESCE(u.email, 'N/A')        AS email,
        er.ROLE        AS role,
        COALESCE(u.department, 'N/A')   AS department,
        COALESCE(u.faculty_name, 'N/A') AS faculty_name,
        COALESCE(u.school_name, 'N/A')  AS school_name,
        er.EVENT_ID    AS event_id,
        em.EVENT       AS event_title
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    LEFT JOIN users u ON er.STUDENT_ID = u.usn_or_emp_id
    WHERE er.EVENT_ID IN ($in_clause)
";

if ($department !== 'all') {
    $dept_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $department));
    $participants_query .= " AND u.department IN (" . implode(',', $dept_array) . ")";
}
if ($faculty !== 'all') {
    $fac_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $faculty));
    $participants_query .= " AND u.faculty_name IN (" . implode(',', $fac_array) . ")";
}
if ($school !== 'all') {
    $sch_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $school));
    $participants_query .= " AND u.school_name IN (" . implode(',', $sch_array) . ")";
}

$participants_result = $conn->query($participants_query);

$participants  = [];
$dept_breakdown = [];
$sem_breakdown  = [];

while ($row = $participants_result->fetch_assoc()) {
    $dept = $row['department'];
    if (!$dept) {
        $dept = (strpos($row['usn'] ?? '', 'EXT') === 0) ? 'External' : 'Unknown';
    }
    $dept_breakdown[$dept] = ($dept_breakdown[$dept] ?? 0) + 1;
    $participants[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => [
        'metrics' => [
            'total_participants'  => count($participants),
            'department_breakdown' => $dept_breakdown,
            'semester_breakdown'   => $sem_breakdown,
        ],
        'participants' => $participants,
        'events_info'  => $events_info,
    ],
]);

$conn->close();
?>
