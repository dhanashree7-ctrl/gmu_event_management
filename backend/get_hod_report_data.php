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

$department = filter_input(INPUT_GET, 'department');
if (!$department) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid department.']);
    exit;
}

// 1. Departmental Event Output (Monthly Bar Chart)
$output_sql = "
    SELECT DATE_FORMAT(START_DATE, '%Y-%m') AS month, COUNT(SL_NO) AS count
    FROM event_master
    WHERE DEPARTMENT = ? AND START_DATE IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
";
$output_stmt = $conn->prepare($output_sql);
$output_stmt->bind_param("s", $department);
$output_stmt->execute();
$output_res = $output_stmt->get_result();

$event_output = [];
while ($row = $output_res->fetch_assoc()) {
    $event_output[] = [
        'month' => $row['month'],
        'count' => (int)$row['count']
    ];
}
$output_stmt->close();

// 2. Student Engagement Index (Line Chart)
$engagement_sql = "
    SELECT DATE_FORMAT(em.START_DATE, '%Y-%m') AS month, COUNT(er.ID) AS count
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    JOIN users u ON er.STUDENT_ID = u.usn_or_emp_id
    WHERE u.department = ? AND em.START_DATE IS NOT NULL
    GROUP BY month
    ORDER BY month ASC
";
$engagement_stmt = $conn->prepare($engagement_sql);
$engagement_stmt->bind_param("s", $department);
$engagement_stmt->execute();
$engagement_res = $engagement_stmt->get_result();

$student_engagement = [];
while ($row = $engagement_res->fetch_assoc()) {
    $student_engagement[] = [
        'month' => $row['month'],
        'count' => (int)$row['count']
    ];
}
$engagement_stmt->close();

// 3. Faculty Leaderboard (Data Table)
$leaderboard_sql = "
    SELECT u.full_name AS faculty_name, COUNT(DISTINCT em.SL_NO) AS total_events, 
           AVG(er.FEEDBACK_RATING) AS average_rating
    FROM users u
    LEFT JOIN event_master em ON em.CREATED_BY = u.id
    LEFT JOIN event_registrations er ON er.EVENT_ID = em.SL_NO AND er.FEEDBACK_RATING > 0
    WHERE u.department = ? AND (u.system_role = 'faculty' OR u.system_role = 'hod')
    GROUP BY u.id
    HAVING total_events > 0
    ORDER BY total_events DESC, average_rating DESC
";
$leaderboard_stmt = $conn->prepare($leaderboard_sql);
$leaderboard_stmt->bind_param("s", $department);
$leaderboard_stmt->execute();
$leaderboard_res = $leaderboard_stmt->get_result();

$faculty_leaderboard = [];
while ($row = $leaderboard_res->fetch_assoc()) {
    $faculty_leaderboard[] = [
        'faculty_name'   => $row['faculty_name'],
        'total_events'   => (int)$row['total_events'],
        'average_rating' => $row['average_rating'] ? round((float)$row['average_rating'], 1) : 0
    ];
}
$leaderboard_stmt->close();

$conn->close();

echo json_encode([
    'success' => true,
    'data' => [
        'event_output'        => $event_output,
        'student_engagement'  => $student_engagement,
        'faculty_leaderboard' => $faculty_leaderboard
    ]
]);
?>
