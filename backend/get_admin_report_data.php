<?php
/**
 * backend/get_admin_report_data.php
 * Returns participation metrics joined from event_master + event_registrations + users.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/auth_middleware.php';
require_auth();
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
    SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.ATTACHMENTS AS attachments_json,
           em.START_DATE AS event_date, em.CATEGORY AS category, em.SCALE AS event_scale,
           em.BUDGET AS budget, u.DISCIPLINE AS department
    FROM event_master em
    LEFT JOIN users u ON u.USER_NAME = em.PROPOSER_ID
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
    
    $attachments = !empty($row['attachments_json']) ? json_decode($row['attachments_json'], true) : [];
    
    $events_info[]     = [
        'id'             => $row['id'],
        'event_title'    => $row['event_title'],
        'report_pdf_path'=> $attachments['report'] ?? null,
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

$in_clause = implode(',', array_map(fn($id) => "'" . $conn->real_escape_string((string)$id) . "'", $valid_event_ids));

$participants_query = "
    SELECT
        COALESCE(u.NAME, 'Unknown Participant') AS participant_name,
        COALESCE(u.USER_NAME, er.USER_ID) AS usn,
        COALESCE(u.EMAIL, 'N/A')        AS email,
        er.DESIGNATION        AS DESIGNATION,
        COALESCE(u.DISCIPLINE, 'N/A')   AS department,
        COALESCE(u.FACULTY, 'N/A') AS faculty_name,
        COALESCE(u.SCHOOL, 'N/A')  AS school_name,
        u.SEMESTER                 AS semester,
        er.EVENT_ID    AS event_id,
        em.EVENT_TITLE AS event_title
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    LEFT JOIN users u ON er.USER_ID = u.USER_NAME
    WHERE er.EVENT_ID IN ($in_clause)
";

if ($department !== 'all') {
    $dept_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $department));
    $participants_query .= " AND u.DISCIPLINE IN (" . implode(',', $dept_array) . ")";
}
if ($faculty !== 'all') {
    $fac_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $faculty));
    $participants_query .= " AND u.FACULTY IN (" . implode(',', $fac_array) . ")";
}
if ($school !== 'all') {
    $sch_array = array_map(fn($i) => "'" . $conn->real_escape_string(trim($i)) . "'", explode(',', $school));
    $participants_query .= " AND u.SCHOOL IN (" . implode(',', $sch_array) . ")";
}

$participants_result = $conn->query($participants_query);

$participants  = [];
$dept_breakdown = [];
$sem_breakdown  = [];

while ($row = $participants_result->fetch_assoc()) {
    $DISCIPLINE = $row['department'];
    if (!$DISCIPLINE) {
        $DISCIPLINE = (strpos($row['usn'] ?? '', 'EXT') === 0) ? 'External' : 'Unknown';
    }
    $dept_breakdown[$DISCIPLINE] = ($dept_breakdown[$DISCIPLINE] ?? 0) + 1;

    $sem = $row['semester'];
    if ($sem) {
        $sem_breakdown[$sem] = ($sem_breakdown[$sem] ?? 0) + 1;
    }

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


