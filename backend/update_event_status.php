<?php
/**
 * backend/update_event_status.php
 * Updates the CURRENT_STATUS of an event in event_master as it moves through the approval pipeline.
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

$raw  = file_get_contents('php://input');
$body = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload.']);
    exit;
}

$event_id = $body['event_id'] ?? '';
if ($event_id === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid event_id is required.']);
    exit;
}

$action          = trim(strtolower((string)($body['action'] ?? '')));
$department_name = $body['department_name'] ?? '';
$remarks         = trim((string)($body['remarks'] ?? ''));

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$DESIGNATION = strtolower($auth_payload['role'] ?? '');
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
$check_sql  = 'SELECT em.EVENT_ID AS event_id, em.EVENT_TITLE AS event_title, em.CURRENT_STATUS AS current_status,
                      em.SCALE AS event_scale, em.APPROVAL_WORKFLOW AS approval_workflow,
                      em.BUDGET AS budget, em.PROPOSER_ID AS proposer_username
               FROM event_master em
               WHERE em.EVENT_ID = ? LIMIT 1';
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param('s', $event_id);
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
$workflow_json_raw = $event['approval_workflow'] ?? '{}';
$workflow = json_decode($workflow_json_raw, true);
if (!is_array($workflow)) $workflow = ['route' => [], 'current_step' => 0, 'history' => []];

$next_step = (int)($workflow['current_step'] ?? 0);
$route = $workflow['route'] ?? [];

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
    if (empty($route)) $route = ['hod'];

    $expected_role      = $route[$next_step] ?? '';
    $normalized_role    = strtolower(str_replace('_', '', $DESIGNATION));
    $normalized_expected = strtolower(str_replace('_', '', $expected_role));

    if ($normalized_role !== $normalized_expected) {
        $conn->close();
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => "Unauthorized. Step expects '{$expected_role}', you actioned as '{$DESIGNATION}'."]);
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


// Step 2 & 3: Update event_master and append to history array
$approver_id = $auth_payload['username'] ?? '';
$notes       = trim($body['notes'] ?? $body['remarks'] ?? '');

$workflow['current_step'] = $next_step;
if (!isset($workflow['history']) || !is_array($workflow['history'])) {
    $workflow['history'] = [];
}
if ($approver_id !== '') {
    $workflow['history'][] = [
        'user_id' => $approver_id,
        'action_taken' => $new_status,
        'notes' => $notes,
        'created_at' => date('c')
    ];
}
$new_workflow_json = json_encode($workflow);

$update_sql  = 'UPDATE event_master SET CURRENT_STATUS = ?, APPROVAL_WORKFLOW = ? WHERE EVENT_ID = ?';
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param('sss', $new_status, $new_workflow_json, $event_id);
if (!$update_stmt->execute()) {
    $update_stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
    exit;
}
$update_stmt->close();

// ── Step 3b: FCM Broadcast Lock (fires only when event becomes published) ──
require_once __DIR__ . '/fcm_helper.php';

if ($new_status === 'published') {
    $lock_stmt = $conn->prepare('SELECT NOTIFICATION_SENT FROM event_master WHERE EVENT_ID = ? LIMIT 1');
    if ($lock_stmt) {
        $lock_stmt->bind_param('s', $event_id);
        $lock_stmt->execute();
        $lock_row = $lock_stmt->get_result()->fetch_assoc();
        $lock_stmt->close();

        if ((int)($lock_row['NOTIFICATION_SENT'] ?? 0) === 0) {
            $event_scale   = $event['event_scale'] ?? 'department';
            $proposer_dept = '';

            $dept_stmt = $conn->prepare('SELECT DISCIPLINE FROM users WHERE USER_NAME = ? LIMIT 1');
            if ($dept_stmt) {
                $dept_stmt->bind_param('s', $event['proposer_username']);
                $dept_stmt->execute();
                if ($dept_row = $dept_stmt->get_result()->fetch_assoc()) {
                    $proposer_dept = $dept_row['DISCIPLINE'] ?? '';
                }
                $dept_stmt->close();
            }

            if ($event_scale === 'university' || $proposer_dept === '') {
                $tok_stmt = $conn->prepare(
                    "SELECT device_token FROM users WHERE USER_GROUP = 'STUDENT' AND device_token IS NOT NULL AND device_token != ''"
                );
                $tok_stmt->execute();
            } else {
                $tok_stmt = $conn->prepare(
                    "SELECT device_token FROM users WHERE USER_GROUP = 'STUDENT' AND DISCIPLINE = ? AND device_token IS NOT NULL AND device_token != ''"
                );
                $tok_stmt->bind_param('s', $proposer_dept);
                $tok_stmt->execute();
            }

            $tok_res = $tok_stmt->get_result();
            $ev_title_safe = htmlspecialchars_decode($event['event_title']);
            while ($t = $tok_res->fetch_assoc()) {
                send_fcm_notification(
                    $t['device_token'],
                    '🎉 New Event Published!',
                    "'{$ev_title_safe}' is now open for registration. Check it out!",
                    '/student-dashboard',
                    null,
                    'student'
                );
            }
            $tok_stmt->close();

            // Set the lock so it only sends once
            $lock_update = $conn->prepare('UPDATE event_master SET NOTIFICATION_SENT = 1 WHERE EVENT_ID = ?');
            if ($lock_update) {
                $lock_update->bind_param('s', $event_id);
                $lock_update->execute();
                $lock_update->close();
            }
        }
    }
}

// ── Step 4: FCM Notifications to Proposer & Next-level Approver ──
$proposer    = $event['proposer_username'] ?? null;
$event_title = $event['event_title'];
$budget      = (float)($event['budget'] ?? 0);

if ($proposer) {
    $remark_text = $notes ? " Reason: $notes" : "";
    if ($new_status === 'published') {
        $msg = "🎉 Your proposal for '$event_title' is fully approved and published directly to the dashboard!$remark_text";
        send_fcm_to_user($conn, $proposer, "✅ Event Published", $msg, '/faculty-dashboard');
    } elseif ($new_status === 'rejected') {
        $msg = "❌ Your proposal for '$event_title' was rejected by $DESIGNATION.$remark_text";
        send_fcm_to_user($conn, $proposer, "❌ Proposal Rejected", $msg, '/faculty-dashboard');
    } else {
        $msg = "✅ Your proposal '$event_title' was approved by $DESIGNATION and moved to the next level.$remark_text";
        send_fcm_to_user($conn, $proposer, "✅ Proposal Progressed", $msg, '/faculty-dashboard');
    }
}

// Notify next-level approver
$next_role_notif = '';
$next_link       = '/executive-dashboard';
if ($new_status === 'pending_director') $next_role_notif = 'director';
elseif ($new_status === 'pending_dean') $next_role_notif = 'dean';
elseif ($new_status === 'pending_provc') $next_role_notif = 'pro_vc';
elseif ($new_status === 'pending_vc')  $next_role_notif = 'vc';

// Map internal next-step role to an enterprise DESIGNATION LIKE pattern
$role_to_designation_pattern = [
    'director' => '%DIRECTOR%',
    'dean'     => '%DEAN%',
    'pro_vc'   => '%VICE CHANCELLOR%',
    'vc'       => 'VICE CHANCELLOR',
];
$desig_pattern = $role_to_designation_pattern[$next_role_notif] ?? '';

if ($desig_pattern) {
    // For pro_vc use NOT LIKE to exclude 'VICE CHANCELLOR' (the VC exact match)
    if ($next_role_notif === 'pro_vc') {
        $next_stmt = $conn->prepare("SELECT USER_NAME FROM users WHERE DESIGNATION LIKE ? AND DESIGNATION NOT LIKE 'VICE CHANCELLOR'");
    } else {
        $next_stmt = $conn->prepare("SELECT USER_NAME FROM users WHERE DESIGNATION LIKE ?");
    }
    if ($next_stmt) {
        $next_stmt->bind_param('s', $desig_pattern);
        $next_stmt->execute();
        $next_res    = $next_stmt->get_result();
        $budget_flag = ($budget > 500000 && in_array($next_role_notif, ['pro_vc', 'vc'])) ? " 💰 High-Budget Alert!" : "";
        $msg         = "New event '$event_title' has escalated to your queue.$budget_flag";
        while ($row = $next_res->fetch_assoc()) {
            $u = $row['USER_NAME'];
            send_fcm_to_user($conn, $u, "📋 Event Escalated for Approval", $msg, $next_link);
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




