<?php
/**
 * backend/get_published_events.php
 * Returns all published events from event_master for the student events browser.
 * Includes registration status, capacity remaining, and role for the calling student.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        echo json_encode(['success' => false, 'message' => 'PHP Fatal Error: ' . $error['message']]);
    }
});

require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$student_id         = $_GET['student_id'] ?? '';
$student_department = '';
$student_usn        = '';

if ($student_id) {
    $stmt = $conn->prepare("SELECT usn_or_emp_id, department FROM users WHERE usn_or_emp_id = ? OR id = ? LIMIT 1");
    $stmt->bind_param("ss", $student_id, $student_id);
    $stmt->execute();
    if ($row = $stmt->get_result()->fetch_assoc()) {
        $student_department = $row['department'];
        $student_usn        = $row['usn_or_emp_id'];
    }
    $stmt->close();
}
$student_usn = $student_usn ?: $student_id;

// Main query: event_master LEFT JOIN event_registrations for student's own registration status
$sql = "SELECT em.SL_NO AS id, em.EVENT AS event_title, em.DESCRIPTION AS description,
               em.CATEGORY AS category, em.EVENT_SCALE AS event_scale,
               em.MODE AS event_mode, emd.BUDGET AS budget, emd.BROUCHER AS brochure_file_path,
               em.START_DATE AS event_date, em.START_TIME AS event_time,
               em.VENUE AS venue, emd.REGISTRATION_DEADLINE AS registration_deadline,
               emd.MAX_PARTICIPANTS AS max_participants,
               emd.MAX_VOLUNTEERS AS max_volunteers, emd.MAX_COORDINATORS AS max_coordinators,
               emd.DETAILS_JSON AS details_json,
               u.full_name AS proposed_by, u.department AS proposer_dept,
               IF(r.ID IS NOT NULL, 1, 0) AS is_registered,
               r.QR_TOKEN AS qr_token, r.CHECK_IN_STATUS AS check_in_status, r.ROLE AS my_role
        FROM event_master AS em
        LEFT JOIN event_metadata AS emd ON emd.EVENT_ID = em.SL_NO
        JOIN users AS u ON u.id = em.CREATED_BY
        LEFT JOIN event_registrations AS r ON r.EVENT_ID = em.SL_NO AND r.STUDENT_ID = ?
        WHERE em.CURRENT_STATUS IN ('published', 'approved')";

if ($student_department) {
    $dept_escaped = $conn->real_escape_string($student_department);
    $sql .= " AND (em.EVENT_SCALE = 'university' OR em.DEPARTMENT = '$dept_escaped')";
}
$sql .= " ORDER BY em.START_DATE ASC, em.START_TIME ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_usn);
$stmt->execute();
$result = $stmt->get_result();

if ($result === false) {
    echo json_encode(['success' => false, 'message' => 'SQL Error: ' . $conn->error]);
    exit;
}

// Build counts lookup: event_id => [role => count]
$count_sql    = "SELECT EVENT_ID, ROLE, COUNT(*) AS cnt FROM event_registrations GROUP BY EVENT_ID, ROLE";
$count_result = $conn->query($count_sql);
$counts       = [];
if ($count_result) {
    while ($crow = $count_result->fetch_assoc()) {
        $eid  = (int)$crow['EVENT_ID'];
        $role = $crow['ROLE'];
        $counts[$eid][$role] = (int)$crow['cnt'];
    }
}

$events = [];
while ($row = $result->fetch_assoc()) {
    $eid        = (int)($row['id'] ?? 0);
    $evt_counts = $counts[$eid] ?? [];

    $slots = [];
    foreach (['participant', 'volunteer', 'coordinator'] as $rk) {
        $maxCol  = 'max_' . $rk . 's';
        $maxVal  = $row[$maxCol];
        $current = $evt_counts[$rk] ?? 0;
        $slots[$rk] = $maxVal === null ? null : max(0, (int)$maxVal - $current);
    }

    $events[] = [
        'id'                    => $eid,
        'event_title'           => $row['event_title']    ?? 'Unknown',
        'description'           => $row['description']    ?? '',
        'category'              => $row['category']       ?? 'N/A',
        'venue'                 => $row['venue']          ?: 'TBD',
        'registration_deadline' => $row['registration_deadline'],
        'proposed_by'           => $row['proposed_by'],
        'proposer_dept'         => $row['proposer_dept'],
        'details'               => !empty($row['details_json']) ? json_decode($row['details_json'], true) : null,
        'date'                  => $row['event_date']  ?: null,
        'time'                  => $row['event_time']  ?: null,
        'event_date'            => $row['event_date']  ?: null,
        'event_time'            => $row['event_time']  ?: null,
        'event_scale'           => $row['event_scale'] ?? 'department',
        'event_mode'            => $row['event_mode']  ?? 'offline',
        'budget'                => $row['budget'],
        'brochure_file_path'    => $row['brochure_file_path'],
        'max_participants'      => $row['max_participants'],
        'max_volunteers'        => $row['max_volunteers'],
        'max_coordinators'      => $row['max_coordinators'],
        'slots_remaining'       => $slots,
        'is_registered'         => (bool)$row['is_registered'],
        'qr_token'              => $row['qr_token'],
        'check_in_status'       => $row['check_in_status'],
        'my_role'               => $row['my_role'],
    ];
}

$stmt->close(); $conn->close();
echo json_encode(['success' => true, 'data' => $events]);
?>