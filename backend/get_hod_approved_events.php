<?php
/**
 * backend/get_hod_approved_events.php
 * Returns all events from the HOD's department that have moved past pending_hod.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

$input = file_get_contents('php://input');
$body  = json_decode($input, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$department = trim($body['department_name'] ?? '');
if ($department === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Department name is required.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$sql = "SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.DESCRIPTION AS description,
               em.CATEGORY AS category, em.SCALE AS event_scale,
               em.BUDGET AS budget, em.CURRENT_STATUS AS current_status,
               u.NAME AS proposed_by, u.DEPT AS proposer_department
        FROM event_master AS em
        JOIN users AS u ON u.USERNAME = em.PROPOSER_ID
        WHERE u.DEPT = ?
          AND em.CURRENT_STATUS NOT IN ('pending_hod','rejected','draft')
        ORDER BY em.START_DATE DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $department);
if (!$stmt->execute()) {
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$result = $stmt->get_result();
$events = [];
while ($row = $result->fetch_assoc()) {
    $events[] = [
        'id'             => $row['id'],
        'event_title'    => $row['event_title'],
        'description'    => $row['description'],
        'category'       => $row['category'],
        'event_scale'    => $row['event_scale'],
        'budget'         => $row['budget'],
        'proposed_by'    => $row['proposed_by'],
        'department'     => $row['proposer_department'],
        'current_status' => $row['current_status'],
    ];
}

$stmt->close(); $conn->close();
http_response_code(200);
echo json_encode(['success' => true, 'data' => $events]);
?>
