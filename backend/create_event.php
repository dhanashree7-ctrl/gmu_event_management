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
$registration_date_raw = isset($_POST['registration_date']) ? trim(strip_tags((string)$_POST['registration_date'])) : '';
$registration_date     = $registration_date_raw === '' ? null : $registration_date_raw;
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
$proposed_by_id = $auth_payload['username'] ?? '';
$role           = strtolower($auth_payload['role'] ?? '');

$max_participants = isset($_POST['max_participants']) && $_POST['max_participants'] !== '' ? (int)$_POST['max_participants'] : null;
$max_volunteers   = isset($_POST['max_volunteers'])   && $_POST['max_volunteers']   !== '' ? (int)$_POST['max_volunteers']   : null;
$max_coordinators = isset($_POST['max_coordinators']) && $_POST['max_coordinators'] !== '' ? (int)$_POST['max_coordinators'] : null;
$coordinator_number = isset($_POST['coordinator_number']) ? trim(strip_tags($_POST['coordinator_number'])) : null;

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
if ($registration_date === null)                    $errors[] = 'Registration date is required.';
if (!in_array($category, $allowed_categories, true)) $errors[] = 'Category must be Academic, Cultural, or Sports.';
if ($event_scale === 'department' && !in_array($event_scale, $allowed_scales, true))  $errors[] = 'Event scale must be "department" or "university".';
if ($budget < 0)                                    $errors[] = 'Budget must be a non-negative number.';
if ($proposed_by_id === '')                         $errors[] = 'A valid proposed_by_id is required.';
if ($event_mode === 'offline' && empty($venue))     $errors[] = 'Venue is required for offline events.';

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

// ---------- Fetch Proposer Context ---------------------------------------
$dept_stmt = $conn->prepare("SELECT DEPT, FACULTY, SCHOOL FROM users WHERE USERNAME = ? LIMIT 1");
$dept_stmt->bind_param('s', $proposed_by_id);
$dept_stmt->execute();
$dept_row  = $dept_stmt->get_result()->fetch_assoc();
$dept_stmt->close();
$proposer_dept    = $dept_row['DEPT'] ?? null;
$proposer_faculty = $dept_row['FACULTY'] ?? null;
$proposer_school  = $dept_row['SCHOOL'] ?? null;

// ---------- Fetch Approval Route -----------------------------------------
$route_stmt = $conn->prepare("SELECT required_chain FROM approval_rules WHERE scale_name = ?");
$route_stmt->bind_param('s', $event_scale);
$route_stmt->execute();
$route_res = $route_stmt->get_result();

if ($route_row = $route_res->fetch_assoc()) {
    $approval_route_arr = json_decode($route_row['required_chain'] ?? $route_row['REQUIRED_CHAIN'], true);
    $approval_route_raw = $route_row['required_chain'] ?? $route_row['REQUIRED_CHAIN'];
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
$initial_status = get_status_from_role($approval_route_arr[0] ?? 'approved');

// Build APPROVAL_WORKFLOW JSON
$workflow_arr = [
    'route' => $approval_route_arr,
    'current_step' => 0,
    'history' => []
];
$workflow_json = json_encode($workflow_arr);

// Build ATTACHMENTS JSON
$attachments_arr = [];
if ($brochure_path !== '') {
    $attachments_arr['brochure'] = $brochure_path;
}


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

if (!empty($details_arr)) {
    $attachments_arr['details'] = $details_arr;
}
$attachments_json = !empty($attachments_arr) ? json_encode($attachments_arr) : null;

$event_id_val = 'EVT-' . strtoupper(uniqid());

$sql = 'INSERT INTO event_master
            (PROPOSER_ID, EVENT_TITLE, DESCRIPTION, CATEGORY, SCALE, MODE, VENUE,
             START_DATE, END_DATE, START_TIME, END_TIME, REGISTRATION_DEADLINE, MAX_PARTICIPANTS, BUDGET, COORDINATOR_NAME, CORDINATOR_CONTACT,
             ATTACHMENTS, CURRENT_STATUS, APPROVAL_WORKFLOW)
        VALUES
            (?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?)';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log('create_event.php – prepare failed: ' . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error. Please try again.']);
    exit;
}

try {
    $stmt->bind_param('ssssssssssssidsssss',
        $proposed_by_id,
        $event_title, $description, $category, $event_scale, $event_mode, $venue,
        $event_date, $event_date, $start_time, $end_time, $registration_date, $max_participants, $budget, $coordinator_name, $coordinator_number,
        $attachments_json, $initial_status, $workflow_json
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

// --- Notification to HOD ---
if ($initial_status === 'pending_hod') {
    $hod_sql  = "SELECT u2.USERNAME FROM users u1 JOIN users u2 ON u1.DEPT = u2.DEPT WHERE u1.USERNAME = ? AND u2.ROLE = 'hod' LIMIT 1";
    $hod_stmt = $conn->prepare($hod_sql);
    if ($hod_stmt) {
        $hod_stmt->bind_param('s', $proposed_by_id);
        $hod_stmt->execute();
        if ($hod_row = $hod_stmt->get_result()->fetch_assoc()) {
            $hod_username = $hod_row['USERNAME'];
            $msg  = "New event proposal '$event_title' requires your approval.";
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
