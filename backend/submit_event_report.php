<?php
/**
 * backend/submit_event_report.php
 * Handles post-event report submission. Flips status to 'completed' in event_master.
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

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

$event_id       = isset($_POST['event_id'])       ? (int)$_POST['event_id']       : 0;
$faculty_id     = isset($_POST['faculty_id'])      ? (int)$_POST['faculty_id']      : 0;
$report_summary = trim($_POST['report_summary']   ?? '');
$has_file       = isset($_FILES['report_file']) && $_FILES['report_file']['error'] !== UPLOAD_ERR_NO_FILE;

if ($event_id <= 0 || $faculty_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required IDs.']);
    exit;
}
if ($report_summary === '' && !$has_file) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provide either a written summary or a PDF report.']);
    exit;
}

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Verify the faculty proposed this event
$check_stmt = $conn->prepare('SELECT CURRENT_STATUS FROM event_master WHERE SL_NO = ? AND CREATED_BY = ?');
if (!$check_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error.']);
    exit;
}
$check_stmt->bind_param('ii', $event_id, $faculty_id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Event not found or unauthorized access.']);
    $check_stmt->close(); $conn->close();
    exit;
}
$event = $check_result->fetch_assoc();
if ($event['CURRENT_STATUS'] === 'completed') {
    echo json_encode(['success' => false, 'message' => 'Event is already marked as completed.']);
    $check_stmt->close(); $conn->close();
    exit;
}
$check_stmt->close();

// Handle file upload
$file_path = null;
if ($has_file) {
    $upload_dir = __DIR__ . '/uploads/reports/';
    $file_info  = $_FILES['report_file'];
    if ($file_info['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'File upload error code: ' . $file_info['error']]);
        $conn->close(); exit;
    }
    $file_ext = strtolower(pathinfo($file_info['name'], PATHINFO_EXTENSION));
    if ($file_ext !== 'pdf') {
        echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed for reports.']);
        $conn->close(); exit;
    }
    if ($file_info['size'] > 5 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'Report file must be under 5MB.']);
        $conn->close(); exit;
    }
    $unique_name = 'report_evt_' . $event_id . '_' . time() . '.pdf';
    if (move_uploaded_file($file_info['tmp_name'], $upload_dir . $unique_name)) {
        $file_path = 'uploads/reports/' . $unique_name;
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file.']);
        $conn->close(); exit;
    }
}

// Update event_master
$update_stmt = $conn->prepare("UPDATE event_master SET CURRENT_STATUS = 'completed' WHERE SL_NO = ?");
if (!$update_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error (prepare update master).']);
    $conn->close(); exit;
}
$update_stmt->bind_param('i', $event_id);
$update_stmt->execute();
$update_stmt->close();

// Update event_metadata
$meta_stmt = $conn->prepare("UPDATE event_metadata SET POST_EVENT_REPORT = ?, REPORT_PDF_PATH = ? WHERE EVENT_ID = ?");
if (!$meta_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error (prepare update meta).']);
    $conn->close(); exit;
}
$meta_stmt->bind_param('ssi', $report_summary, $file_path, $event_id);
if ($meta_stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Report submitted. Event marked as completed!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save report.']);
}
$meta_stmt->close(); $conn->close();
?>
