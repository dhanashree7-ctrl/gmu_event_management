<?php
/**
 * backend/get_pending_events.php
 * Returns all pending events from event_master based on the approver's DESIGNATION.
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

$DESIGNATION       = strtolower(trim($auth_payload['role'] ?? ''));
$department = trim($auth_payload['department_name'] ?? '');

if ($DESIGNATION === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'DESIGNATION is required in token.']);
    exit;
}

// Map DESIGNATION → target status
$status_map = [
    'hod'      => 'pending_hod',
    'director' => 'pending_director',
    'dean'     => 'pending_dean',
    'provc'    => 'pending_provc',
    'pro_vc'   => 'pending_provc',
    'vc'       => 'pending_vc',
];
if (!isset($status_map[$DESIGNATION])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized DESIGNATION for approvals.']);
    exit;
}
$target_status = $status_map[$DESIGNATION];

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if ($DESIGNATION === 'hod') {
    if ($department === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Department name is required for HODs.']);
        exit;
    }
    $sql = "SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.DESCRIPTION AS description,
                   em.CATEGORY AS category, em.SCALE AS event_scale, em.BUDGET AS budget,
                   em.ATTACHMENTS AS attachments_json,
                   em.MAX_PARTICIPANTS AS max_participants, em.REGISTRATION_DEADLINE AS registration_deadline,
                   em.COORDINATOR_NAME AS coordinator_name, em.CORDINATOR_CONTACT AS coordinator_number,
                   u.NAME AS proposed_by, u.DISCIPLINE AS proposer_department, u.DESIGNATION AS proposer_role
            FROM event_master AS em
            JOIN users AS u ON u.USER_NAME = em.PROPOSER_ID
            WHERE em.CURRENT_STATUS = ? AND u.DISCIPLINE = ?
            ORDER BY em.EVENT_ID ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $target_status, $department);
} else {
    $sql = "SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.DESCRIPTION AS description,
                   em.CATEGORY AS category, em.SCALE AS event_scale, em.BUDGET AS budget,
                   em.ATTACHMENTS AS attachments_json,
                   em.MAX_PARTICIPANTS AS max_participants, em.REGISTRATION_DEADLINE AS registration_deadline,
                   em.COORDINATOR_NAME AS coordinator_name, em.CORDINATOR_CONTACT AS coordinator_number,
                   u.NAME AS proposed_by, u.DISCIPLINE AS department, u.DESIGNATION AS proposer_role
            FROM event_master AS em
            JOIN users AS u ON u.USER_NAME = em.PROPOSER_ID
            WHERE em.CURRENT_STATUS = ?
            ORDER BY em.EVENT_ID ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $target_status);
}

if (!$stmt->execute()) {
    error_log('get_pending_events.php – query failed: ' . $stmt->error);
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error.']);
    exit;
}

$result = $stmt->get_result();
$events = [];

while ($row = $result->fetch_assoc()) {
    $attachments = !empty($row['attachments_json']) ? json_decode($row['attachments_json'], true) : [];
    $brochure_path = $attachments['brochure'] ?? null;

    $events[] = [
        'id'                 => (int)$row['id'],
        'event_title'        => $row['event_title'],
        'description'        => $row['description'],
        'category'           => $row['category'],
        'event_scale'        => $row['event_scale'],
        'budget'             => $row['budget'],
        'brochure_file_path' => $brochure_path,
        'immediate_approval' => false,
        'details'            => null,
        'proposed_by'        => $row['proposed_by'],
        'department'         => $row['proposer_department'] ?? $row['department'] ?? '',
        'proposer_role'      => $row['proposer_role'],
        'max_participants'   => $row['max_participants'],
        'registration_deadline' => $row['registration_deadline'],
        'coordinator_name'   => $row['coordinator_name'],
        'coordinator_number' => $row['coordinator_number'],
    ];
}

$stmt->close(); $conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>

