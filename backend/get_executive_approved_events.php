<?php
/**
 * backend/get_executive_approved_events.php
 * Returns events that an executive (director/dean/provc/vc) has already processed.
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

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$role = trim($auth_payload['role'] ?? '');

if ($role === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role is required in token.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Statuses that mean "past this executive's approval step"
$status_map = [
    'director' => ["'pending_dean'","'pending_provc'","'pending_vc'","'approved'","'published'","'completed'","'pending_report'"],
    'dean'     => ["'pending_provc'","'pending_vc'","'approved'","'published'","'completed'","'pending_report'"],
    'provc'    => ["'pending_vc'","'approved'","'published'","'completed'","'pending_report'"],
    'pro_vc'   => ["'pending_vc'","'approved'","'published'","'completed'","'pending_report'"],
    'vc'       => ["'approved'","'published'","'completed'","'pending_report'"],
];

if (!isset($status_map[$role])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Invalid role for executive history.']);
    exit;
}

$in_clause = implode(',', $status_map[$role]);

$sql = "SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.DESCRIPTION AS description,
               em.CATEGORY AS category, em.BUDGET AS budget,
               em.CURRENT_STATUS AS current_status, em.SCALE AS event_scale,
               em.MAX_PARTICIPANTS AS max_participants, em.REGISTRATION_DEADLINE AS registration_deadline,
               em.COORDINATOR_NAME AS coordinator_name, em.CORDINATOR_CONTACT AS coordinator_number,
               u.NAME AS proposed_by, u.DEPT AS department
        FROM event_master AS em
        JOIN users AS u ON u.USERNAME = em.PROPOSER_ID
        WHERE em.CURRENT_STATUS IN ($in_clause) AND em.SCALE = 'university'
        ORDER BY em.START_DATE DESC";

$stmt = $conn->prepare($sql);
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
        'budget'         => $row['budget'],
        'proposed_by'    => $row['proposed_by'],
        'department'     => $row['department'],
        'current_status' => $row['current_status'],
        'event_scale'    => $row['event_scale'],
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
