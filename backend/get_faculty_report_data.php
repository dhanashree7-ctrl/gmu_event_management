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

$user_id = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid user ID.']);
    exit;
}

// 1. Fetch check-in funnel data
$funnel_sql = "
    SELECT 
        COUNT(er.ID) AS total_registered,
        SUM(CASE WHEN er.CHECK_IN_STATUS = 'checked_in' THEN 1 ELSE 0 END) AS total_checked_in
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE em.CREATED_BY = ?
";
$funnel_stmt = $conn->prepare($funnel_sql);
$funnel_stmt->bind_param("i", $user_id);
$funnel_stmt->execute();
$funnel_row = $funnel_stmt->get_result()->fetch_assoc();
$funnel_stmt->close();

$check_in_funnel = [
    'registered' => (int)($funnel_row['total_registered'] ?? 0),
    'checked_in' => (int)($funnel_row['total_checked_in'] ?? 0)
];

// 2. Fetch Demographics
$demo_sql = "
    SELECT COALESCE(u.department, 'External/Unknown') AS department, COUNT(er.ID) as count
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    LEFT JOIN users u ON er.STUDENT_ID = u.usn_or_emp_id
    WHERE em.CREATED_BY = ?
    GROUP BY u.department
    ORDER BY count DESC
";
$demo_stmt = $conn->prepare($demo_sql);
$demo_stmt->bind_param("i", $user_id);
$demo_stmt->execute();
$demo_res = $demo_stmt->get_result();

$demographics = [];
while ($row = $demo_res->fetch_assoc()) {
    $demographics[] = [
        'department' => $row['department'],
        'count'      => (int)$row['count']
    ];
}
$demo_stmt->close();

// 3. Fetch Feedback Distribution
$feedback_sql = "
    SELECT er.FEEDBACK_RATING AS rating, COUNT(er.ID) as count
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE em.CREATED_BY = ? AND er.FEEDBACK_RATING IS NOT NULL AND er.FEEDBACK_RATING > 0
    GROUP BY er.FEEDBACK_RATING
    ORDER BY er.FEEDBACK_RATING ASC
";
$feedback_stmt = $conn->prepare($feedback_sql);
$feedback_stmt->bind_param("i", $user_id);
$feedback_stmt->execute();
$feedback_res = $feedback_stmt->get_result();

$feedback_distribution = [
    '1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0
];
$total_score = 0;
$total_feedbacks = 0;
while ($row = $feedback_res->fetch_assoc()) {
    $r = (int)$row['rating'];
    if (isset($feedback_distribution[(string)$r])) {
        $feedback_distribution[(string)$r] = (int)$row['count'];
        $total_score += ($r * (int)$row['count']);
        $total_feedbacks += (int)$row['count'];
    }
}
$feedback_stmt->close();

$average_score = $total_feedbacks > 0 ? round($total_score / $total_feedbacks, 1) : 0;

$conn->close();

echo json_encode([
    'success' => true,
    'data' => [
        'check_in_funnel' => $check_in_funnel,
        'demographics'    => $demographics,
        'feedback_distribution' => $feedback_distribution,
        'average_score'   => $average_score,
        'total_feedbacks' => $total_feedbacks
    ]
]);
?>
