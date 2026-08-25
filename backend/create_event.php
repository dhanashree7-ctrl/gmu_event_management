<?php
/**
 * backend/create_event.php
 * Creates a new event blueprint in event_master.
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

// ---------- Parse Form Data ----------------------------------------------
$event_title      = isset($_POST['event_title'])   ? trim(strip_tags((string)$_POST['event_title']))   : '';
$description      = isset($_POST['description'])   ? trim(strip_tags((string)$_POST['description']))   : '';
$event_date_raw   = isset($_POST['event_date'])    ? trim(strip_tags((string)$_POST['event_date']))    : '';
$event_date       = $event_date_raw === '' ? null : $event_date_raw;
$category         = trim((string)($_POST['category']     ?? ''));
$allowed_categories = ['Academic', 'Cultural', 'Sports'];
$event_scale      = strtolower(trim((string)($_POST['event_scale']  ?? 'department')));
$allowed_scales   = ['department', 'university'];
$event_mode       = strtolower(trim((string)($_POST['event_mode']   ?? 'offline')));
$allowed_modes    = ['offline', 'online'];
if (!in_array($event_mode, $allowed_modes, true)) $event_mode = 'offline';

$start_time       = isset($_POST['start_time']) && trim($_POST['start_time']) !== '' ? trim($_POST['start_time']) : null;
$end_time         = isset($_POST['end_time'])   && trim($_POST['end_time'])   !== '' ? trim($_POST['end_time'])   : null;
$venue            = isset($_POST['venue'])      && trim($_POST['venue'])      !== '' ? trim($_POST['venue'])      : null;

$budget_raw       = $_POST['budget'] ?? null;
$budget           = is_numeric($budget_raw) ? (float)$budget_raw : -1;
require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();
$proposed_by_id = (int)$auth_payload['id'];
$role           = strtolower($auth_payload['role']);
$immediate_approval = isset($_POST['immediate_approval']) && filter_var($_POST['immediate_approval'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

$max_participants = isset($_POST['max_participants']) && $_POST['max_participants'] !== '' ? (int)$_POST['max_participants'] : null;
$max_volunteers   = isset($_POST['max_volunteers'])   && $_POST['max_volunteers']   !== '' ? (int)$_POST['max_volunteers']   : null;
$max_coordinators = isset($_POST['max_coordinators']) && $_POST['max_coordinators'] !== '' ? (int)$_POST['max_coordinators'] : null;

$participation_type = strtolower(trim((string)($_POST['participation_type'] ?? 'solo')));
if (!in_array($participation_type, ['solo', 'group'], true)) $participation_type = 'solo';
$max_team_size = isset($_POST['max_team_size']) && $_POST['max_team_size'] !== '' ? (int)$_POST['max_team_size'] : null;

// Handle Brochure Upload
$brochure_path = '';
if (isset($_FILES['brochure']) && $_FILES['brochure']['error'] === UPLOAD_ERR_OK) {
    $uploadDir  = 'uploads/';
    $fileName   = basename($_FILES['brochure']['name']);
    $fileExt    = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
    if (!in_array($fileExt, $allowedExts)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid file type for brochure. Only PDF, JPG, and PNG are allowed.']);
        exit;
    }
    $newFileName = 'event_proposal_' . time() . '_' . uniqid() . '.' . $fileExt;
    $targetPath  = $uploadDir . $newFileName;
    if (move_uploaded_file($_FILES['brochure']['tmp_name'], $targetPath)) {
        $brochure_path = $targetPath;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to upload brochure file.']);
        exit;
    }
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Brochure document is required for the proposal.']);
    exit;
}

// ---------- Validation ---------------------------------------------------
$errors = [];
if ($event_title === '')                             $errors[] = 'Event title is required.';
elseif (strlen($event_title) > 200)                 $errors[] = 'Event title must be 200 characters or fewer.';
if ($event_date === null)                           $errors[] = 'Event date is required.';
if (!in_array($category, $allowed_categories, true)) $errors[] = 'Category must be Academic, Cultural, or Sports.';
if (!in_array($event_scale, $allowed_scales, true))  $errors[] = 'Event scale must be "department" or "university".';
if ($budget < 0)                                    $errors[] = 'Budget must be a non-negative number.';
if ($proposed_by_id === false || $proposed_by_id <= 0) $errors[] = 'A valid proposed_by_id is required.';

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ---------- Database Connection ------------------------------------------
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

// ---------- Fetch Proposer Department ------------------------------------
$dept_stmt = $conn->prepare("SELECT department FROM users WHERE id = ? LIMIT 1");
$dept_stmt->bind_param('i', $proposed_by_id);
$dept_stmt->execute();
$dept_row  = $dept_stmt->get_result()->fetch_assoc();
$dept_stmt->close();
$proposer_dept = $dept_row['department'] ?? '';

// ---------- Fetch Approval Route -----------------------------------------
$route_stmt = $conn->prepare("SELECT required_chain FROM approval_rules WHERE scale_name = ?");
$route_stmt->bind_param('s', $event_scale);
$route_stmt->execute();
$route_res = $route_stmt->get_result();

if ($route_row = $route_res->fetch_assoc()) {
    $approval_route_arr = json_decode($route_row['required_chain'], true);
    $approval_route_raw = $route_row['required_chain'];
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => "Approval routing rules are missing for the scale: '{$event_scale}'."]);
    exit;
}
$route_stmt->close();

function get_status_from_role(string $r): string {
    $r = strtolower(trim($r));
    if ($r === 'pro_vc' || $r === 'provc') return 'pending_provc';
    return 'pending_' . $r;
}
$initial_status = get_status_from_role($approval_route_arr[0]);

// ---------- Sub-events / Details JSON ------------------------------------
$is_festival = isset($_POST['is_festival']) && $_POST['is_festival'] === 'true';
$sub_events  = [];
if ($is_festival && isset($_POST['sub_events'])) {
    $decoded = json_decode($_POST['sub_events'], true);
    if (is_array($decoded)) $sub_events = $decoded;
}
$rewards = isset($_POST['rewards']) ? trim(strip_tags((string)$_POST['rewards'])) : '';
$coordinator_name = isset($_POST['coordinator_name']) ? trim(strip_tags($_POST['coordinator_name'])) : '';
$details_arr = [];
if ($is_festival && !empty($sub_events)) { $details_arr['is_festival'] = true; $details_arr['sub_events'] = $sub_events; }
if ($rewards !== '')                      $details_arr['rewards'] = $rewards;
if ($coordinator_name !== '')             $details_arr['coordinator_name'] = $coordinator_name;
$details_json = !empty($details_arr) ? json_encode($details_arr) : null;

$event_id_val = 'EVT-' . strtoupper(uniqid());

$sql = 'INSERT INTO event_master
            (EVENT_ID, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CATEGORY, TYPE, MODE,
             CREATED_BY, DEPARTMENT, CURRENT_STATUS, EVENT_SCALE, IMMEDIATE_APPROVAL)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?)';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log('create_event.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error. Please try again.']);
    exit;
}

$type_fallback = 'Event';
try {
    $stmt->bind_param('sssssssssssssssi',
        $event_id_val, $event_title, $description, $event_date, $event_date, $start_time, $end_time, $venue, $category, $type_fallback, $event_mode,
        $proposed_by_id, $proposer_dept, $initial_status, $event_scale, $immediate_approval
    );

    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }
} catch (Exception $e) {
    error_log('create_event.php – execute failed: ' . $e->getMessage());
    $stmt->close(); $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create event. Please try again.']);
    exit;
}

$new_event_id = $stmt->insert_id;
$stmt->close();

$meta_sql = 'INSERT INTO event_metadata
                (EVENT_ID, BROUCHER, BUDGET, APPROVAL_ROUTE, APPROVAL_STEP, MAX_PARTICIPANTS, MAX_VOLUNTEERS, MAX_COORDINATORS, PARTICIPATION_TYPE, MAX_TEAM_SIZE, APPROVAL_HISTORY_JSON, DETAILS_JSON)
             VALUES
                (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, JSON_ARRAY(), ?)';
$meta_stmt = $conn->prepare($meta_sql);
if ($meta_stmt) {
    $meta_stmt->bind_param('isdsiiisis',
        $new_event_id, $brochure_path, $budget, $approval_route_raw,
        $max_participants, $max_volunteers, $max_coordinators,
        $participation_type, $max_team_size, $details_json
    );
    $meta_stmt->execute();
    $meta_stmt->close();
}

// --- Notification to HOD ---
if ($initial_status === 'pending_hod') {
    $hod_sql  = "SELECT u2.usn_or_emp_id FROM users u1 JOIN users u2 ON u1.department = u2.department WHERE u1.id = ? AND u2.system_role = 'hod' LIMIT 1";
    $hod_stmt = $conn->prepare($hod_sql);
    if ($hod_stmt) {
        $hod_stmt->bind_param('i', $proposed_by_id);
        $hod_stmt->execute();
        if ($hod_row = $hod_stmt->get_result()->fetch_assoc()) {
            $hod_username = $hod_row['usn_or_emp_id'];
            $msg  = ($immediate_approval ? "🚨 URGENT: " : "") . "New event proposal '$event_title' requires your approval.";
            $link = "/hod-dashboard";
            $notif_stmt = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, ?)");
            if ($notif_stmt) { $notif_stmt->bind_param('sss', $hod_username, $msg, $link); $notif_stmt->execute(); $notif_stmt->close(); }
        }
        $hod_stmt->close();
    }
}

$conn->close();

http_response_code(201);
echo json_encode([
    'success'         => true,
    'message'         => 'Event request submitted successfully.',
    'event_id'        => $new_event_id,
    'status_assigned' => $initial_status,
]);
?>
