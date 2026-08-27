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

require_once __DIR__ . '/auth_middleware.php';
$auth_payload = require_auth();

$event_id       = isset($_POST['event_id'])       ? (string)$_POST['event_id']       : '';
$faculty_id     = trim($auth_payload['username'] ?? '');
$report_summary = trim($_POST['report_summary']   ?? '');
$has_file       = isset($_FILES['report_file']) && $_FILES['report_file']['error'] !== UPLOAD_ERR_NO_FILE;

$has_gallery    = isset($_FILES['gallery_images']) && count($_FILES['gallery_images']['name']) > 0 && $_FILES['gallery_images']['error'][0] !== UPLOAD_ERR_NO_FILE;

if ($event_id === '' || $faculty_id === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required IDs.']);
    exit;
}

if ($report_summary === '' && !$has_file) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Provide either a written summary or a PDF report.']);
    exit;
}

if (!$has_gallery) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'You must upload at least one photo (1-10 max) for the event gallery.']);
    exit;
}

$gallery_count = count($_FILES['gallery_images']['name']);
if ($gallery_count > 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'You can upload a maximum of 10 photos.']);
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
$check_stmt = $conn->prepare('SELECT CURRENT_STATUS, ATTACHMENTS FROM event_master WHERE EVENT_ID = ? AND PROPOSER_ID = ?');
if (!$check_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error.']);
    exit;
}
$check_stmt->bind_param('ss', $event_id, $faculty_id);
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

// Handle file upload for report
$file_path = null;
if ($has_file) {
    $upload_dir = __DIR__ . '/uploads/reports/';
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);
    
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

// Handle gallery images
$gallery_paths = [];
if ($has_gallery) {
    $upload_dir = __DIR__ . '/uploads/gallery/';
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

    for ($i = 0; $i < $gallery_count; $i++) {
        if ($_FILES['gallery_images']['error'][$i] === UPLOAD_ERR_OK) {
            $file_ext = strtolower(pathinfo($_FILES['gallery_images']['name'][$i], PATHINFO_EXTENSION));
            if (!in_array($file_ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                continue; // Skip invalid formats
            }
            $unique_name = 'gallery_evt_' . $event_id . '_' . time() . '_' . $i . '.' . $file_ext;
            if (move_uploaded_file($_FILES['gallery_images']['tmp_name'][$i], $upload_dir . $unique_name)) {
                $gallery_paths[] = 'uploads/gallery/' . $unique_name;
            }
        }
    }
}

if (empty($gallery_paths)) {
    echo json_encode(['success' => false, 'message' => 'Failed to upload gallery images, or format not supported (JPG/PNG/WEBP).']);
    $conn->close(); exit;
}

$gallery_json = json_encode($gallery_paths);

// Read existing attachments
$attachments = !empty($event['ATTACHMENTS']) ? json_decode($event['ATTACHMENTS'], true) : [];
$attachments['report'] = $file_path;
$attachments['report_summary'] = $report_summary;
$attachments['gallery_images'] = $gallery_paths;
$attachments_json = json_encode($attachments);

// Update event_master
$update_stmt = $conn->prepare("UPDATE event_master SET CURRENT_STATUS = 'completed', ATTACHMENTS = ? WHERE EVENT_ID = ?");
if (!$update_stmt) {
    echo json_encode(['success' => false, 'message' => 'Internal Server Error (prepare update master).']);
    $conn->close(); exit;
}
$update_stmt->bind_param('ss', $attachments_json, $event_id);

if ($update_stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Report submitted. Event marked as completed!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save report.']);
}
$update_stmt->close(); $conn->close();
?>
