<?php
/**
 * backend/process_checkin.php
 * Processes QR check-in. Fetches event details from event_master.
 * Updates event_registrations (CHECK_IN_STATUS, STATUS).
 */


require_once __DIR__ . '/config/cors.php';
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

header('Content-Type: application/json');
require_once __DIR__ . '/auth_middleware.php';
require_auth();
require_once __DIR__ . '/config/db.php';

try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$input             = file_get_contents("php://input");
$data              = json_decode($input, true);
$qr_token          = $data['qr_token'] ?? null;
$selected_event_id = $data['event_id'] ?? null;

if (!$qr_token) {
    echo json_encode(['success' => false, 'message' => 'Missing QR token.']);
    exit;
}

$stmt = $conn->prepare("
    SELECT er.ID, er.CHECK_IN_STATUS, er.EVENT_ID, er.USER_ID,
           u.NAME AS STUDENT_NAME,
           em.EVENT_TITLE AS event_title, em.START_DATE AS event_date, em.START_TIME AS event_time
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    LEFT JOIN users u ON er.USER_ID = u.USERNAME
    WHERE er.QR_CODE = ?
");
$stmt->bind_param("s", $qr_token);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid QR Ticket!']);
    $stmt->close(); $conn->close(); exit;
}
$registration = $result->fetch_assoc();
$stmt->close();

if ($selected_event_id && (string)$registration['EVENT_ID'] !== (string)$selected_event_id) {
    echo json_encode(['success' => false, 'message' => "Wrong event! This ticket is for '{$registration['event_title']}'. "]);
    $conn->close(); exit;
}

if ($registration['CHECK_IN_STATUS'] === 'checked_in') {
    echo json_encode(['success' => false, 'message' => "Student already checked in!"]);
    $conn->close(); exit;
}

// Date & Time Window Validation
$event_date = $registration['event_date'];
$event_time = $registration['event_time'];

if ($event_date && $event_time) {
    $now   = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
    $today = $now->format('Y-m-d');

    if ($today !== $event_date) {
        $formatted_date = date('d M Y', strtotime($event_date));
        echo json_encode(['success' => false, 'message' => "This QR code is only valid on $formatted_date."]);
        $conn->close(); exit;
    }

    $event_start  = new DateTime("$event_date $event_time", new DateTimeZone('Asia/Kolkata'));
    $window_open  = (clone $event_start)->modify('-30 minutes');

    if ($now < $window_open) {
        $open_time = $window_open->format('h:i A');
        echo json_encode(['success' => false, 'message' => "Check-in opens at $open_time (30 mins before event)."]);
        $conn->close(); exit;
    }
    if ($now > $event_start) {
        echo json_encode(['success' => false, 'message' => "Check-in window has closed. The event has already started."]);
        $conn->close(); exit;
    }
}

// Mark checked_in in event_registrations
$updateStmt = $conn->prepare("UPDATE event_registrations SET CHECK_IN_STATUS = 'checked_in', CHECK_IN_TIME = NOW() WHERE QR_CODE = ?");
$updateStmt->bind_param("s", $qr_token);
if (!$updateStmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Failed to process check-in.']);
    $updateStmt->close(); $conn->close(); exit;
}
$updateStmt->close();

echo json_encode([
    'success'       => true,
    'message'       => 'Check-in successful!',
    'student_name'  => $registration['STUDENT_NAME'],
    'event_title'   => $registration['event_title'],
    'check_in_time' => date('h:i A'),
]);
$conn->close();
?>

