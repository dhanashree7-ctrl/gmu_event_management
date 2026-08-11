<?php
/**
 * backend/get_pending_events.php
 * Returns all pending events from event_master based on the approver's role.
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

$role       = strtolower(trim($body['role']            ?? ''));
$department = trim($body['department_name']             ?? '');

if ($role === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role is required.']);
    exit;
}

// Map role → target status
$status_map = [
    'hod'      => 'pending_hod',
    'director' => 'pending_director',
    'dean'     => 'pending_dean',
    'provc'    => 'pending_provc',
    'pro_vc'   => 'pending_provc',
    'vc'       => 'pending_vc',
];
if (!isset($status_map[$role])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized role for approvals.']);
    exit;
}
$target_status = $status_map[$role];

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if ($role === 'hod') {
    if ($department === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Department name is required for HODs.']);
        exit;
    }
    $sql = "SELECT em.SL_NO AS id, em.EVENT AS event_title, em.DESCRIPTION AS description,
                   em.CATEGORY AS category, em.EVENT_SCALE AS event_scale, emd.BUDGET AS budget,
                   emd.BROUCHER AS brochure_file_path, em.IMMEDIATE_APPROVAL AS immediate_approval,
                   emd.DETAILS_JSON AS details_json,
                   u.full_name AS proposed_by, u.department AS proposer_department, u.system_role AS proposer_role
            FROM event_master AS em
            LEFT JOIN event_metadata AS emd ON emd.EVENT_ID = em.SL_NO
            JOIN users AS u ON u.id = em.CREATED_BY
            WHERE em.CURRENT_STATUS = ? AND em.DEPARTMENT = ?
            ORDER BY em.IMMEDIATE_APPROVAL DESC, em.SL_NO ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ss', $target_status, $department);
} else {
    $sql = "SELECT em.SL_NO AS id, em.EVENT AS event_title, em.DESCRIPTION AS description,
                   em.CATEGORY AS category, em.EVENT_SCALE AS event_scale, emd.BUDGET AS budget,
                   emd.BROUCHER AS brochure_file_path, em.IMMEDIATE_APPROVAL AS immediate_approval,
                   emd.DETAILS_JSON AS details_json,
                   u.full_name AS proposed_by, u.department AS department, u.system_role AS proposer_role
            FROM event_master AS em
            LEFT JOIN event_metadata AS emd ON emd.EVENT_ID = em.SL_NO
            JOIN users AS u ON u.id = em.CREATED_BY
            WHERE em.CURRENT_STATUS = ?
            ORDER BY em.IMMEDIATE_APPROVAL DESC, em.SL_NO ASC";
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
    $events[] = [
        'id'                 => (int)$row['id'],
        'event_title'        => $row['event_title'],
        'description'        => $row['description'],
        'category'           => $row['category'],
        'event_scale'        => $row['event_scale'],
        'budget'             => $row['budget'],
        'brochure_file_path' => $row['brochure_file_path'],
        'immediate_approval' => (bool)$row['immediate_approval'],
        'details'            => !empty($row['details_json']) ? json_decode($row['details_json'], true) : null,
        'proposed_by'        => $row['proposed_by'],
        'department'         => $row['proposer_department'] ?? $row['department'] ?? '',
        'proposer_role'      => $row['proposer_role'],
    ];
}

$stmt->close(); $conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>