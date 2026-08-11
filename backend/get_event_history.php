<?php
/**
 * backend/get_event_history.php
 * Returns event details + approval audit trail from event_master.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config/db.php';

$event_id = filter_input(INPUT_GET, 'event_id', FILTER_VALIDATE_INT);
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

$event_sql = "SELECT em.SL_NO AS id, em.EVENT AS event_title, em.CATEGORY AS category,
                     em.EVENT_SCALE AS event_scale, em.CURRENT_STATUS AS current_status,
                     emd.BUDGET AS budget, u.full_name AS proposed_by,
                     em.APPROVAL_HISTORY_JSON AS approval_history_json, emd.DETAILS_JSON AS details_json
              FROM event_master em
              LEFT JOIN event_metadata emd ON em.SL_NO = emd.EVENT_ID
              JOIN users u ON em.CREATED_BY = u.id
              WHERE em.SL_NO = ? LIMIT 1";

$event_stmt = $conn->prepare($event_sql);
$event_stmt->bind_param("i", $event_id);
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

$raw_history = json_decode($event_data['approval_history_json'] ?? '[]', true);
$history = [];
if (!empty($raw_history)) {
    $userIds   = array_map(fn($item) => (int)$item['user_id'], $raw_history);
    $in_clause = implode(',', $userIds);
    $users_res = $conn->query("SELECT id, full_name, system_role FROM users WHERE id IN ($in_clause)");
    $usersMap  = [];
    if ($users_res) {
        while ($u = $users_res->fetch_assoc()) $usersMap[$u['id']] = $u;
    }
    foreach ($raw_history as $h) {
        $uid       = $h['user_id'];
        $history[] = [
            'action_taken'  => $h['action_taken'],
            'notes'         => $h['notes'],
            'created_at'    => $h['created_at'],
            'approver_name' => $usersMap[$uid]['full_name']    ?? 'Unknown',
            'role_name'     => $usersMap[$uid]['system_role']  ?? 'Unknown',
        ];
    }
}
$conn->close();

echo json_encode(['success' => true, 'event' => $event_data, 'data' => $history]);
?>
