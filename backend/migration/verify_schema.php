<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

// Expected schema definition
$expected = [
    'users' => [
        'id','usn_or_emp_id','username','full_name','email','password','password_hash',
        'system_role','role','department','faculty_name','school_name','is_active','created_at'
    ],
    'event_master' => [
        'SL_NO','EVENT_ID','DEPARTMENT','CATEGORY','TYPE','MODE','EVENT','DESCRIPTION',
        'START_DATE','END_DATE','START_TIME','END_TIME','VENUE','COORDINATOR','CONTACT',
        'LAST_UPDATED','CREATED_BY','STATUS','CURRENT_STATUS','EVENT_SCALE',
        'IMMEDIATE_APPROVAL','faculty','school','is_archived','organizer_id'
    ],
    'event_metadata' => [
        'ID','EVENT_ID','ACADEMIC_YEAR','SEASON','SEM','SECTION','SUBJECT_CODE','SUBJECT',
        'PARTICULAR','REGISTRATION_DEADLINE','PARTICIPATION_TYPE','MAX_PARTICIPANTS',
        'MAX_TEAM_SIZE','MAX_VOLUNTEERS','MAX_COORDINATORS','BROUCHER','ATTACHMENTS',
        'POST_EVENT_REPORT','REPORT_PDF_PATH','DETAILS_JSON','REMARKS','APPROVAL_ROUTE',
        'APPROVAL_STEP','APPROVAL_HISTORY_JSON','BUDGET','SUB_EVENT_ID','SUB_EVENT_NAME',
        'chat_history'
    ],
    'event_registrations' => [
        'ID','STUDENT_ID','user_id','EVENT_ID','SUB_EVENT_ID','REGISTRATION_DATE','STATUS',
        'ROLE','CERTIFICATE_URL','FEEDBACK_RATING','feedback_rating','FEEDBACK_COMMENTS',
        'feedback_text','feedback_submitted','QR_TOKEN','qr_code','SPECIAL_REQUIREMENTS',
        'CHECK_IN_STATUS','attendance_status','attended','CHECK_IN_TIME','details_json',
        'TEAM_LEAD','TEAM_MEMBERS','IS_EXTERNAL','COLLEGE_NAME','PHONE','EMAIL'
    ],
    'notifications' => [
        'id','user_id','message','target_link','is_read','created_at'
    ],
    'approval_rules' => [
        'id','scale_name','event_type','level','role','role_name','required_chain'
    ],
];

$allOk = true;
echo "<style>
  body { font-family: monospace; background: #0f0f1a; color: #e0e0e0; padding: 24px; }
  h2 { color: #90CAF9; }
  .table-ok { color: #69F0AE; font-weight: bold; }
  .table-miss { color: #FF5252; font-weight: bold; }
  .col-ok { color: #B9F6CA; }
  .col-miss { background: #FF1744; color: #fff; padding: 2px 8px; border-radius: 4px; }
  .col-extra { color: #FFD740; }
  table { border-collapse: collapse; margin-bottom: 24px; width: 100%; }
  th { background: #1a237e; padding: 8px 12px; text-align: left; }
  td { padding: 6px 12px; border-bottom: 1px solid #333; }
  .summary-ok { background: #1B5E20; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 1.1em; }
  .summary-fail { background: #B71C1C; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 1.1em; }
</style>";
echo "<h2>🔍 GMU_Events01 — Schema Verification Report</h2>";
echo "<p>Database: <strong>" . DB_NAME . "</strong></p>";

foreach ($expected as $table => $expected_cols) {
    // Check if table exists
    $res = $conn->query("SHOW TABLES LIKE '$table'");
    if ($res->num_rows === 0) {
        echo "<p class='table-miss'>❌ TABLE MISSING: $table</p>";
        $allOk = false;
        continue;
    }

    // Get actual columns
    $col_res = $conn->query("SHOW COLUMNS FROM `$table`");
    $actual_cols = [];
    while ($row = $col_res->fetch_assoc()) {
        $actual_cols[] = $row['Field'];
    }

    $missing = array_diff($expected_cols, $actual_cols);
    $extra   = array_diff($actual_cols, $expected_cols);

    $status_icon = count($missing) === 0 ? '✅' : '⚠️';
    echo "<p class='" . (count($missing) === 0 ? 'table-ok' : 'table-miss') . "'>$status_icon TABLE: $table (" . count($actual_cols) . " columns found, " . count($expected_cols) . " expected)</p>";

    echo "<table><tr><th>Column</th><th>Status</th></tr>";
    foreach ($expected_cols as $col) {
        $found = in_array($col, $actual_cols);
        if (!$found) $allOk = false;
        echo "<tr><td>$col</td><td class='" . ($found ? 'col-ok' : 'col-miss') . "'>" . ($found ? '✅ Present' : '❌ MISSING') . "</td></tr>";
    }
    foreach ($extra as $col) {
        echo "<tr><td>$col</td><td class='col-extra'>➕ Extra (not in spec, but harmless)</td></tr>";
    }
    echo "</table>";
}

if ($allOk) {
    echo "<div class='summary-ok'>✅ ALL TABLES AND COLUMNS VERIFIED — Schema is 100% complete!</div>";
} else {
    echo "<div class='summary-fail'>⚠️ Some columns or tables are missing. See above for details.</div>";
}
$conn->close();
?>
