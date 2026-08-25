<?php
/**
 * backend/update_event_status.php
 * Updates the CURRENT_STATUS of an event in event_master as it moves through the approval pipeline.
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

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$event_id = filter_var($body['event_id'] ?? 0, FILTER_VALIDATE_INT);
if ($event_id === false || $event_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid event_id is required.']);
    exit;
}

$action          = trim(strtolower((string)($body['action'] ?? '')));
$department_name = $body['department_name'] ?? '';
$remarks         = trim((string)($body['remarks'] ?? ''));

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$role = strtolower($auth_payload['role']);
$department_name = $auth_payload['department_name']; // Optional: override department with verified data


if (!in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action. Use approve or reject.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

// Step 1: Verify event exists in event_master
$check_sql  = 'SELECT em.SL_NO AS id, em.EVENT AS event_title, em.CURRENT_STATUS AS current_status,
                      em.EVENT_SCALE AS event_scale, emd.APPROVAL_ROUTE AS approval_route,
                      emd.APPROVAL_STEP AS approval_step, emd.BUDGET AS budget,
                      u.usn_or_emp_id AS proposer_username
               FROM event_master em
               LEFT JOIN event_metadata emd ON em.SL_NO = emd.EVENT_ID
               LEFT JOIN users u ON em.CREATED_BY = u.id
               WHERE em.SL_NO = ? LIMIT 1';
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param('i', $event_id);
$check_stmt->execute();
$event = $check_stmt->get_result()->fetch_assoc();
$check_stmt->close();

if (!$event) {
    $conn->close();
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Event not found.']);
    exit;
}

$new_status = '';
$next_step  = (int)($event['approval_step'] ?? 0);

$actionable = ['pending_hod', 'pending_director', 'pending_dean', 'pending_provc', 'pending_vc'];
if (!in_array($event['current_status'], $actionable, true)) {
    $conn->close();
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => "Event already finalized (status: {$event['current_status']})."]);
    exit;
}

if ($action === 'reject') {
    $new_status = 'rejected';
} else {
    $route_raw = $event['approval_route'] ?? '[]';
    $route     = json_decode($route_raw, true);
    if (!is_array($route) || empty($route)) $route = ['hod'];

    $expected_role      = $route[$next_step] ?? '';
    $normalized_role    = strtolower(str_replace('_', '', $role));
    $normalized_expected = strtolower(str_replace('_', '', $expected_role));

    if ($normalized_role !== $normalized_expected) {
        $conn->close();
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => "Unauthorized. Step expects '{$expected_role}', you actioned as '{$role}'."]);
        exit;
    }

    $next_step++;
    if ($next_step < count($route)) {
        $nr = $route[$next_step];
        $new_status = ($nr === 'pro_vc' || $nr === 'provc') ? 'pending_provc' : 'pending_' . strtolower(trim($nr));
    } else {
        $new_status = 'published';
    }
}


// Step 2: Update event_master and event_metadata
$update_sql  = 'UPDATE event_master SET CURRENT_STATUS = ? WHERE SL_NO = ?';
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param('si', $new_status, $event_id);
if (!$update_stmt->execute()) {
    $update_stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
    exit;
}
$update_stmt->close();

$update_meta_sql  = 'UPDATE event_metadata SET APPROVAL_STEP = ?, REMARKS = ? WHERE EVENT_ID = ?';
$update_meta_stmt = $conn->prepare($update_meta_sql);
$update_meta_stmt->bind_param('isi', $next_step, $remarks, $event_id);
$update_meta_stmt->execute();
$update_meta_stmt->close();

// Step 3: Append audit trail to APPROVAL_HISTORY_JSON
$approver_id = filter_var($body['user_id'] ?? 0, FILTER_VALIDATE_INT);
$notes       = trim($body['notes'] ?? $body['remarks'] ?? '');
if ($approver_id > 0) {
    $history_sql  = "UPDATE event_metadata SET APPROVAL_HISTORY_JSON = JSON_ARRAY_APPEND(COALESCE(APPROVAL_HISTORY_JSON, JSON_ARRAY()), '\$', JSON_OBJECT('user_id', ?, 'action_taken', ?, 'notes', ?, 'created_at', NOW())) WHERE EVENT_ID = ?";
    $history_stmt = $conn->prepare($history_sql);
    if ($history_stmt) {
        $history_stmt->bind_param("issi", $approver_id, $new_status, $notes, $event_id);
        $history_stmt->execute();
        $history_stmt->close();
    }
}

// Step 4: Notifications
$proposer    = $event['proposer_username'] ?? null;
$event_title = $event['event_title'];
$budget      = (float)($event['budget'] ?? 0);

if ($proposer) {
    $remark_text = $remarks ? " Reason: $remarks" : "";
    if ($new_status === 'published')  $msg = "🎉 Your proposal for '$event_title' is fully approved and published directly to the dashboard!$remark_text";
    elseif ($new_status === 'rejected') $msg = "❌ Your proposal for '$event_title' was rejected by $role.$remark_text";
    else $msg = "✅ Your proposal '$event_title' was approved by $role and moved to the next level.$remark_text";

    $notif_stmt = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/faculty-dashboard')");
    if ($notif_stmt) { $notif_stmt->bind_param('ss', $proposer, $msg); $notif_stmt->execute(); $notif_stmt->close(); }
}

// Notify next-level approver
$next_role_notif = '';
$next_link       = '/executive-dashboard';
if ($new_status === 'pending_director') $next_role_notif = 'director';
elseif ($new_status === 'pending_dean') $next_role_notif = 'dean';
elseif ($new_status === 'pending_provc') $next_role_notif = 'pro_vc';
elseif ($new_status === 'pending_vc')  $next_role_notif = 'vc';

if ($next_role_notif) {
    $next_stmt = $conn->prepare("SELECT usn_or_emp_id AS username FROM users WHERE system_role = ?");
    if ($next_stmt) {
        $next_stmt->bind_param('s', $next_role_notif);
        $next_stmt->execute();
        $next_res    = $next_stmt->get_result();
        $budget_flag = ($budget > 500000 && in_array($next_role_notif, ['pro_vc', 'vc'])) ? " 💰 High-Budget Alert!" : "";
        $msg         = "New event '$event_title' has escalated to your queue.$budget_flag";
        $notif_stmt  = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, ?)");
        if ($notif_stmt) {
            while ($row = $next_res->fetch_assoc()) {
                $u = $row['username'];
                $notif_stmt->bind_param('sss', $u, $msg, $next_link);
                $notif_stmt->execute();
            }
            $notif_stmt->close();
        }
        $next_stmt->close();
    }
}

$conn->close();

http_response_code(200);
echo json_encode([
    'success'     => true,
    'message'     => "Event updated to {$new_status}.",
    'event_id'    => $event_id,
    'event_title' => $event['event_title'],
]);
?>