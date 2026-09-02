<?php
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$student_id = $auth_payload['username'] ?? '';

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Missing USER_NAME in token.']);
    exit;
}

// Ensure the student ID corresponds to a valid user/usn.
$stmt = $conn->prepare("SELECT USER_NAME FROM users WHERE USER_NAME = ? OR ID = ? LIMIT 1");
$stmt->bind_param("ss", $student_id, $student_id);
$stmt->execute();
$usn = '';
if ($row = $stmt->get_result()->fetch_assoc()) {
    $usn = $row['USER_NAME'];
}
$stmt->close();
$usn = $usn ?: $student_id;

// 1. My Engagement Profile (Radar Chart - Group by Category)
$eng_sql = "
    SELECT COALESCE(em.CATEGORY, 'Uncategorized') as category, COUNT(r.ID) as count
    FROM event_registrations r
    JOIN event_master em ON r.EVENT_ID = em.EVENT_ID
    WHERE r.USER_ID = ?
    GROUP BY category
";
$stmt = $conn->prepare($eng_sql);
$stmt->bind_param("s", $usn);
$stmt->execute();
$eng_res = $stmt->get_result();
$engagement_profile = [];
while ($row = $eng_res->fetch_assoc()) {
    $engagement_profile[] = [
        'category' => $row['category'],
        'count' => (int)$row['count']
    ];
}
$stmt->close();

// 2. DESIGNATION Breakdown (Donut Chart - Group by DESIGNATION)
$role_sql = "
    SELECT COALESCE(ROLE, 'participant') as role_name, COUNT(ID) as count
    FROM event_registrations
    WHERE USER_ID = ?
    GROUP BY role_name
";
$stmt = $conn->prepare($role_sql);
$stmt->bind_param("s", $usn);
$stmt->execute();
$role_res = $stmt->get_result();
$role_breakdown = [];
while ($row = $role_res->fetch_assoc()) {
    $role_breakdown[] = [
        'name' => ucfirst($row['role_name']),
        'count' => (int)$row['count']
    ];
}
$stmt->close();

// 3. Reliability Score (Checked-in / Total Active Registrations)
$score_sql = "
    SELECT 
        COUNT(ID) as total_registrations,
        SUM(CASE WHEN CHECK_IN_STATUS = 'checked_in' THEN 1 ELSE 0 END) as checked_in_count
    FROM event_registrations
    WHERE USER_ID = ?
";
$stmt = $conn->prepare($score_sql);
$stmt->bind_param("s", $usn);
$stmt->execute();
$score_res = $stmt->get_result();
$reliability_data = ['total' => 0, 'attended' => 0, 'score' => 0];
if ($row = $score_res->fetch_assoc()) {
    $total = (int)$row['total_registrations'];
    $attended = (int)$row['checked_in_count'];
    $score = $total > 0 ? round(($attended / $total) * 100) : 0;
    $reliability_data = [
        'total' => $total,
        'attended' => $attended,
        'score' => $score
    ];
}
$stmt->close();

$conn->close();

echo json_encode([
    'success' => true,
    'data' => [
        'engagement_profile' => $engagement_profile,
        'role_breakdown' => $role_breakdown,
        'reliability' => $reliability_data
    ]
]);
?>


