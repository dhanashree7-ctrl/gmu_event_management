<?php
/**
 * backend/get_hod_approved_events.php
 * Returns all events from the HOD's department that have moved past pending_hod.
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed. Use POST.']);
    exit;
}

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();

$department = trim($auth_payload['department_name'] ?? '');
if ($department === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Department name is required in token.']);
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
               em.MAX_PARTICIPANTS AS max_participants, em.REGISTRATION_DEADLINE AS registration_deadline,
               em.COORDINATOR_NAME AS coordinator_name, em.CORDINATOR_CONTACT AS coordinator_number,
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
        'max_participants'      => $row['max_participants'],
        'registration_deadline' => $row['registration_deadline'],
        'coordinator_name'      => $row['coordinator_name'],
        'coordinator_number'    => $row['coordinator_number'],
    ];
}

$stmt->close(); $conn->close();
http_response_code(200);
echo json_encode(['success' => true, 'data' => $events]);
?>

