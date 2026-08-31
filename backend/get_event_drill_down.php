<?php
/**
 * backend/get_event_drill_down.php
 * Returns detailed stats for a single event: participants, feedback, department breakdown.
 * Fetches event blueprint from event_master, participants from event_registrations.
 */
declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/auth_middleware.php';
require_auth();
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$event_id = $_GET['event_id'] ?? $_POST['event_id'] ?? null;
if (!$event_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing event_id']);
    exit;
}

// 1. Fetch Master Event from event_master
$stmt = $conn->prepare("
    SELECT em.*, u.NAME AS proposed_by_name, u.DEPT AS proposer_dept 
    FROM event_master em 
    LEFT JOIN users u ON em.PROPOSER_ID = u.USERNAME 
    WHERE em.EVENT_ID = ?
");
$stmt->bind_param("s", $event_id);
$stmt->execute();
$master_result = $stmt->get_result();

if ($master_result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Master event not found.']);
    exit;
}
$master_event = $master_result->fetch_assoc();
// Normalize key names for frontend compatibility
$master_event['id']           = $master_event['EVENT_ID'];
$master_event['event_title']  = $master_event['EVENT_TITLE'];
$master_event['description']  = $master_event['DESCRIPTION'];
$master_event['category']     = $master_event['CATEGORY'];
$master_event['event_scale']  = $master_event['SCALE'];
$master_event['current_status'] = $master_event['CURRENT_STATUS'];
$master_event['budget']       = $master_event['BUDGET'];
$attachments = !empty($master_event['ATTACHMENTS']) ? json_decode($master_event['ATTACHMENTS'], true) : [];
$master_event['details_json'] = $master_event['ATTACHMENTS']; // using attachments for details if needed
$master_event['brochure_file_path'] = $attachments['brochure'] ?? null;
$master_event['report_file_path'] = $attachments['report'] ?? null;

// 2. Fetch Participants from event_registrations joined with users
$stmt2 = $conn->prepare("
    SELECT r.ID, r.USER_ID, r.ROLE, r.FEEDBACK_JSON, r.EXTERNAL_DETAILS,
           u.NAME AS STUDENT_NAME, u.USERNAME AS USN, u.DEPT, u.SCHOOL, u.FACULTY
    FROM event_registrations r
    LEFT JOIN users u ON r.USER_ID = u.USERNAME
    WHERE r.EVENT_ID = ?
");
$stmt2->bind_param("s", $event_id);
$stmt2->execute();
$participants_result = $stmt2->get_result();

$total_participants      = 0;
$department_breakdown    = [];
$external_colleges       = [];
$feedback_sum            = 0;
$feedback_count          = 0;
$feedback_comments       = [];
$participants            = [];
$is_festival             = false;
$sub_event_breakdown     = [];
$internal_count          = 0;
$external_count          = 0;
$external_college_breakdown = [];

if (isset($attachments['details'])) {
    $master_json = $attachments['details'];
    if (isset($master_json['is_festival']) && $master_json['is_festival'] === true) {
        $is_festival = true;
        if (isset($master_json['sub_events']) && is_array($master_json['sub_events'])) {
            foreach ($master_json['sub_events'] as $se) $sub_event_breakdown[$se] = 0;
        }
    }
}

while ($row = $participants_result->fetch_assoc()) {
    $total_participants++;
    $dept = $row['DEPT'];
    if (!empty($dept) && $dept !== 'Unknown Department') {
        $department_breakdown[$dept] = ($department_breakdown[$dept] ?? 0) + 1;
    }

    $feedback = !empty($row['FEEDBACK_JSON']) ? json_decode($row['FEEDBACK_JSON'], true) : [];
    $rating = $feedback['rating'] ?? 0;
    if (is_numeric($rating) && $rating > 0) {
        $feedback_sum += (float)$rating;
        $feedback_count++;
    }
    $comment = $feedback['comment'] ?? '';
    if (!empty($comment) && trim($comment) !== '') {
        $feedback_comments[] = [
            'name'    => $row['STUDENT_NAME'] ?? $row['USN'],
            'rating'  => $rating,
            'comment' => $comment,
        ];
    }

    $joined_sub_events = [];
    $college = 'GMU';
    $details_json = $row['EXTERNAL_DETAILS'];
    if ($details_json) {
        $decoded = json_decode($details_json, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            if (isset($decoded['external_college_name']) && trim($decoded['external_college_name']) !== '') {
                $college = trim($decoded['external_college_name']);
                if (!in_array($college, $external_colleges)) $external_colleges[] = $college;
            }
            if ($is_festival && isset($decoded['registered_sub_events']) && is_array($decoded['registered_sub_events'])) {
                $joined_sub_events = $decoded['registered_sub_events'];
                foreach ($joined_sub_events as $se) {
                    $sub_event_breakdown[$se] = ($sub_event_breakdown[$se] ?? 0) + 1;
                }
            }
        }
    }

    if ($college === 'GMU') {
        $internal_count++;
    } else {
        $external_count++;
        $external_college_breakdown[$college] = ($external_college_breakdown[$college] ?? 0) + 1;
    }

    $participants[] = [
        'name'       => $row['STUDENT_NAME'] ?? $row['USN'],
        'usn'        => $row['USN'],
        'role'       => $row['ROLE'],
        'faculty'    => $row['FACULTY'],
        'school'     => $row['SCHOOL'],
        'department' => $row['DEPT'],
        'college'    => $college,
        'sub_events' => $joined_sub_events,
    ];
}

$avg_feedback = $feedback_count > 0 ? round($feedback_sum / $feedback_count, 1) : 0;

echo json_encode([
    'success' => true,
    'data'    => [
        'master_event' => $master_event,
        'participants' => $participants,
        'metrics'      => [
            'total_participants'         => $total_participants,
            'department_breakdown'       => $department_breakdown,
            'external_colleges_count'    => count($external_colleges),
            'external_colleges_list'     => $external_colleges,
            'external_college_breakdown' => $external_college_breakdown,
            'internal_count'             => $internal_count,
            'external_count'             => $external_count,
            'average_feedback'           => $avg_feedback,
            'total_feedbacks'            => $feedback_count,
            'feedback_comments'          => $feedback_comments,
            'is_festival'                => $is_festival,
            'sub_event_breakdown'        => $sub_event_breakdown,
        ],
    ],
]);

$conn->close();
?>

