<?php
/**
 * backend/get_event_history.php
 * Returns event details + approval audit trail from event_master.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
require_once __DIR__ . '/config/db.php';

$event_id = filter_input(INPUT_GET, 'event_id', FILTER_SANITIZE_STRING);
if (!$event_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Valid event_id is required.']);
    exit;
}

try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$event_sql = "SELECT em.EVENT_ID AS id, em.EVENT_TITLE AS event_title, em.CATEGORY AS category,
                     em.SCALE AS event_scale, em.CURRENT_STATUS AS current_status,
                     em.BUDGET AS budget, u.NAME AS proposed_by,
                     em.APPROVAL_WORKFLOW AS approval_workflow_json, em.ATTACHMENTS AS details_json
              FROM event_master em
              JOIN users u ON em.PROPOSER_ID = u.USERNAME
              WHERE em.EVENT_ID = ? LIMIT 1";

$event_stmt = $conn->prepare($event_sql);
$event_stmt->bind_param("s", $event_id);
$event_stmt->execute();
$event_data = $event_stmt->get_result()->fetch_assoc();
$event_stmt->close();

if (!$event_data) {
    $conn->close();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Event not found.']);
    exit;
}

if (!empty($event_data['details_json'])) {
    $event_data['details'] = json_decode($event_data['details_json'], true);
}
unset($event_data['details_json']);

$workflow = json_decode($event_data['approval_workflow_json'] ?? '{}', true);
unset($event_data['approval_workflow_json']);
$raw_history = $workflow['history'] ?? [];
$history = [];
if (!empty($raw_history)) {
    $userIds = array_map(fn($item) => "'" . $conn->real_escape_string($item['user_id']) . "'", $raw_history);
    $in_clause = implode(',', $userIds);
    $users_res = $conn->query("SELECT USERNAME, NAME, ROLE FROM users WHERE USERNAME IN ($in_clause)");
    $usersMap  = [];
    if ($users_res) {
        while ($u = $users_res->fetch_assoc()) $usersMap[$u['USERNAME']] = $u;
    }
    foreach ($raw_history as $h) {
        $uid       = $h['user_id'];
        $history[] = [
            'action_taken'  => $h['action_taken'],
            'notes'         => $h['notes'] ?? '',
            'created_at'    => $h['created_at'],
            'approver_name' => $usersMap[$uid]['NAME']    ?? 'Unknown',
            'role_name'     => $usersMap[$uid]['ROLE']  ?? 'Unknown',
        ];
    }
}
$conn->close();

echo json_encode(['success' => true, 'event' => $event_data, 'data' => $history]);
?>
