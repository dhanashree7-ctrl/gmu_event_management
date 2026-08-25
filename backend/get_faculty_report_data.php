<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$user_id = filter_input(INPUT_GET, 'user_id', FILTER_SANITIZE_STRING);
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
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE em.PROPOSER_ID = ?
";
$funnel_stmt = $conn->prepare($funnel_sql);
$funnel_stmt->bind_param("s", $user_id);
$funnel_stmt->execute();
$funnel_row = $funnel_stmt->get_result()->fetch_assoc();
$funnel_stmt->close();

$check_in_funnel = [
    'registered' => (int)($funnel_row['total_registered'] ?? 0),
    'checked_in' => (int)($funnel_row['total_checked_in'] ?? 0)
];

// 2. Fetch Demographics
$demo_sql = "
    SELECT COALESCE(u.DEPT, 'External/Unknown') AS department, COUNT(er.ID) as count
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    LEFT JOIN users u ON er.USER_ID = u.USERNAME
    WHERE em.PROPOSER_ID = ?
    GROUP BY u.DEPT
    ORDER BY count DESC
";
$demo_stmt = $conn->prepare($demo_sql);
$demo_stmt->bind_param("s", $user_id);
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
    SELECT JSON_EXTRACT(er.FEEDBACK_JSON, '$.rating') AS rating, COUNT(er.ID) as count
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE em.PROPOSER_ID = ? AND JSON_EXTRACT(er.FEEDBACK_JSON, '$.rating') IS NOT NULL AND JSON_EXTRACT(er.FEEDBACK_JSON, '$.rating') > 0
    GROUP BY JSON_EXTRACT(er.FEEDBACK_JSON, '$.rating')
    ORDER BY JSON_EXTRACT(er.FEEDBACK_JSON, '$.rating') ASC
";
$feedback_stmt = $conn->prepare($feedback_sql);
$feedback_stmt->bind_param("s", $user_id);
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
