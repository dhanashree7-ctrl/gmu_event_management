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

$input = file_get_contents('php://input');
$body  = json_decode($input, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$role = trim($body['role'] ?? '');
if ($role === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role is required.']);
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

$sql = "SELECT em.SL_NO AS id, em.EVENT AS event_title, em.DESCRIPTION AS description,
               em.CATEGORY AS category, emd.BUDGET AS budget,
               em.CURRENT_STATUS AS current_status, em.EVENT_SCALE AS event_scale,
               u.full_name AS proposed_by, u.department AS department
        FROM event_master AS em
        LEFT JOIN event_metadata AS emd ON em.SL_NO = emd.EVENT_ID
        JOIN users AS u ON u.id = em.CREATED_BY
        WHERE em.CURRENT_STATUS IN ($in_clause) AND em.EVENT_SCALE = 'university'
        ORDER BY em.SL_NO DESC";

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
        'id'             => (int)$row['id'],
        'event_title'    => $row['event_title'],
        'description'    => $row['description'],
        'category'       => $row['category'],
        'budget'         => $row['budget'],
        'proposed_by'    => $row['proposed_by'],
        'department'     => $row['department'],
        'current_status' => $row['current_status'],
        'event_scale'    => $row['event_scale'],
    ];
}

$stmt->close(); $conn->close();
http_response_code(200);
echo json_encode(['success' => true, 'data' => $events]);
?>
