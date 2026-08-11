<?php
/**
 * 02_migrate_data.php
 * One-time migration: copies all data from gmu_events → GMU_Events01
 * Uses direct INSERT with proper escaping (no bind_param variadic issue)
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

$DB_HOST = 'localhost';
$DB_PORT = 3306;
$DB_USER = 'root';
$DB_PASS = 'dhanashreessql2025';
$OLD_DB  = 'gmu_events';
$NEW_DB  = 'GMU_Events01';

echo "<pre style='font-family:monospace;font-size:14px;background:#1a1a2e;color:#e0e0e0;padding:20px;'>";
echo "╔══════════════════════════════════════════════════════╗\n";
echo "║      GMU_Events01 — Data Migration Script           ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

$old = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $OLD_DB, $DB_PORT);
if ($old->connect_errno) die("❌ OLD DB error: " . $old->connect_error);
$old->set_charset('utf8mb4');
echo "✅ Connected to OLD database: $OLD_DB\n";

$new = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $NEW_DB, $DB_PORT);
if ($new->connect_errno) die("❌ NEW DB error: " . $new->connect_error . "\n\n(Run 01_create_GMU_Events01.sql first!)");
$new->set_charset('utf8mb4');
echo "✅ Connected to NEW database: $NEW_DB\n\n";

function esc($conn, $val) {
    if ($val === null) return 'NULL';
    return "'" . $conn->real_escape_string((string)$val) . "'";
}

// ═══════════════════════════════════════════════════════════
// 1. USERS
// ═══════════════════════════════════════════════════════════
echo "── Migrating: users\n";
$res = $old->query("SELECT * FROM users");
$count = $skip = 0;
while ($r = $res->fetch_assoc()) {
    $sql = "INSERT IGNORE INTO users 
        (id, usn_or_emp_id, username, full_name, email, password, password_hash, system_role, role, department, faculty_name, school_name, is_active)
        VALUES (" .
        esc($new, $r['id']) . "," .
        esc($new, $r['usn_or_emp_id'] ?? null) . "," .
        esc($new, $r['username'] ?? null) . "," .
        esc($new, $r['full_name'] ?? null) . "," .
        esc($new, $r['email'] ?? '') . "," .
        esc($new, $r['password'] ?? '') . "," .
        esc($new, $r['password_hash'] ?? null) . "," .
        esc($new, $r['system_role'] ?? 'student') . "," .
        esc($new, $r['system_role'] ?? 'student') . "," .
        esc($new, $r['department'] ?? null) . "," .
        esc($new, $r['faculty_name'] ?? null) . "," .
        esc($new, $r['school_name'] ?? null) . "," .
        esc($new, $r['is_active'] ?? 1) . ")";
    if ($new->query($sql)) $count++; else $skip++;
}
echo "   ✅ Inserted: $count  |  Skipped: $skip\n\n";

// ═══════════════════════════════════════════════════════════
// 2. EVENT MASTER
// ═══════════════════════════════════════════════════════════
echo "── Migrating: event_master\n";
$res = $old->query("SELECT * FROM event_master");
$count = $skip = 0;
while ($r = $res->fetch_assoc()) {
    $sl = (int)($r['SL_NO'] ?? 0);
    $dept = preg_replace('/[^A-Z0-9]/i', '', strtoupper($r['DEPARTMENT'] ?? 'GEN'));
    $eid_str = $dept . '-' . $sl;
    $sql = "INSERT IGNORE INTO event_master
        (SL_NO, EVENT_ID, DEPARTMENT, CATEGORY, TYPE, MODE, EVENT, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME, VENUE, CREATED_BY, STATUS, CURRENT_STATUS, EVENT_SCALE, faculty, school, is_archived)
        VALUES (" .
        esc($new, $sl) . "," .
        esc($new, $eid_str) . "," .
        esc($new, $r['DEPARTMENT'] ?? 'Unknown') . "," .
        esc($new, $r['CATEGORY'] ?? 'General') . "," .
        esc($new, $r['TYPE'] ?? 'Event') . "," .
        esc($new, $r['MODE'] ?? 'offline') . "," .
        esc($new, $r['EVENT'] ?? 'Untitled') . "," .
        esc($new, $r['DESCRIPTION'] ?? '') . "," .
        esc($new, $r['START_DATE'] ?? date('Y-m-d')) . "," .
        esc($new, $r['END_DATE'] ?? date('Y-m-d')) . "," .
        esc($new, $r['START_TIME'] ?? null) . "," .
        esc($new, $r['END_TIME'] ?? null) . "," .
        esc($new, $r['VENUE'] ?? null) . "," .
        esc($new, (int)($r['CREATED_BY'] ?? 1)) . "," .
        esc($new, $r['STATUS'] ?? 'active') . "," .
        esc($new, $r['CURRENT_STATUS'] ?? 'pending') . "," .
        esc($new, $r['EVENT_SCALE'] ?? null) . "," .
        esc($new, $r['faculty'] ?? null) . "," .
        esc($new, $r['school'] ?? null) . "," .
        esc($new, (int)($r['is_archived'] ?? 0)) . ")";
    if ($new->query($sql)) $count++; else $skip++;
}
echo "   ✅ Inserted: $count  |  Skipped: $skip\n\n";

// ═══════════════════════════════════════════════════════════
// 3. EVENT METADATA
// ═══════════════════════════════════════════════════════════
echo "── Migrating: event_metadata\n";
$res = $old->query("SELECT * FROM event_metadata");
$count = $skip = 0;
while ($r = $res->fetch_assoc()) {
    $eid = (int)($r['EVENT_ID'] ?? 0);
    if (!$eid) { $skip++; continue; }
    $sql = "INSERT IGNORE INTO event_metadata
        (EVENT_ID, REGISTRATION_DEADLINE, MAX_PARTICIPANTS, MAX_VOLUNTEERS, MAX_COORDINATORS, MAX_TEAM_SIZE, BUDGET, APPROVAL_STEP, DETAILS_JSON, APPROVAL_HISTORY_JSON, BROUCHER, REMARKS)
        VALUES (" .
        esc($new, $eid) . "," .
        esc($new, $r['REGISTRATION_DEADLINE'] ?? null) . "," .
        esc($new, $r['MAX_PARTICIPANTS'] ?? null) . "," .
        esc($new, $r['MAX_VOLUNTEERS'] ?? null) . "," .
        esc($new, $r['MAX_COORDINATORS'] ?? null) . "," .
        esc($new, $r['MAX_TEAM_SIZE'] ?? 1) . "," .
        esc($new, (float)($r['BUDGET'] ?? 0)) . "," .
        esc($new, (int)($r['APPROVAL_STEP'] ?? 0)) . "," .
        esc($new, $r['DETAILS_JSON'] ?? null) . "," .
        esc($new, $r['APPROVAL_HISTORY_JSON'] ?? null) . "," .
        esc($new, $r['BROUCHER'] ?? null) . "," .
        esc($new, $r['REMARKS'] ?? null) . ")";
    if ($new->query($sql)) $count++; else { $skip++; }
}
echo "   ✅ Inserted: $count  |  Skipped: $skip\n\n";

// ═══════════════════════════════════════════════════════════
// 4. EVENT REGISTRATIONS
// ═══════════════════════════════════════════════════════════
echo "── Migrating: event_registrations\n";
$res = $old->query("SELECT * FROM event_registrations");
$count = $skip = 0;
while ($r = $res->fetch_assoc()) {
    // Map old 'registered' → new 'pending'
    $checkin = ($r['CHECK_IN_STATUS'] === 'checked_in') ? 'checked_in' : 'pending';
    $role = in_array($r['ROLE'] ?? '', ['participant','volunteer','coordinator','organiser'])
        ? $r['ROLE'] : 'participant';
    $sql = "INSERT INTO event_registrations
        (STUDENT_ID, EVENT_ID, ROLE, QR_TOKEN, CHECK_IN_STATUS, FEEDBACK_RATING, FEEDBACK_COMMENTS, SPECIAL_REQUIREMENTS, IS_EXTERNAL, COLLEGE_NAME, details_json)
        VALUES (" .
        esc($new, $r['STUDENT_ID'] ?? null) . "," .
        esc($new, (int)($r['EVENT_ID'] ?? 0)) . "," .
        esc($new, $role) . "," .
        esc($new, $r['QR_TOKEN'] ?? null) . "," .
        esc($new, $checkin) . "," .
        esc($new, $r['FEEDBACK_RATING'] ?? null) . "," .
        esc($new, $r['FEEDBACK_COMMENTS'] ?? null) . "," .
        esc($new, $r['SPECIAL_REQUIREMENTS'] ?? null) . "," .
        esc($new, (int)($r['IS_EXTERNAL'] ?? 0)) . "," .
        esc($new, $r['COLLEGE_NAME'] ?? null) . "," .
        esc($new, $r['details_json'] ?? null) . ")";
    if ($new->query($sql)) $count++; else $skip++;
}
echo "   ✅ Inserted: $count  |  Skipped: $skip\n\n";

// ═══════════════════════════════════════════════════════════
// 5. NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
echo "── Migrating: notifications\n";
$res = $old->query("SELECT * FROM notifications");
$count = $skip = 0;
while ($r = $res->fetch_assoc()) {
    $sql = "INSERT INTO notifications (user_id, message, target_link, is_read) VALUES (" .
        esc($new, (string)($r['user_id'] ?? '')) . "," .
        esc($new, $r['message'] ?? '') . "," .
        esc($new, $r['target_link'] ?? null) . "," .
        esc($new, (int)($r['is_read'] ?? 0)) . ")";
    if ($new->query($sql)) $count++; else $skip++;
}
echo "   ✅ Inserted: $count  |  Skipped: $skip\n\n";

// ═══════════════════════════════════════════════════════════
echo "╔══════════════════════════════════════════════════════════╗\n";
echo "║  🎉  MIGRATION COMPLETE!                                 ║\n";
echo "║                                                          ║\n";
echo "║  ✅ Next step: Change db.php DB_NAME to GMU_Events01    ║\n";
echo "╚══════════════════════════════════════════════════════════╝\n";
echo "</pre>";

$old->close();
$new->close();
?>
