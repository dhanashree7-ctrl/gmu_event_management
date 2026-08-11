<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$sql = "CREATE TABLE IF NOT EXISTS `event_metadata` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `EVENT_ID` INT NOT NULL,
  `ACADEMIC_YEAR` VARCHAR(10) DEFAULT NULL,
  `SEASON` VARCHAR(10) DEFAULT NULL,
  `SEM` INT DEFAULT NULL,
  `SECTION` VARCHAR(10) DEFAULT NULL,
  `SUBJECT_CODE` VARCHAR(15) DEFAULT NULL,
  `SUBJECT` VARCHAR(100) DEFAULT NULL,
  `PARTICULAR` VARCHAR(50) DEFAULT NULL,
  `REGISTRATION_DEADLINE` DATETIME DEFAULT NULL,
  `PARTICIPATION_TYPE` VARCHAR(20) DEFAULT NULL,
  `MAX_PARTICIPANTS` INT DEFAULT NULL,
  `MAX_TEAM_SIZE` INT DEFAULT 1,
  `MAX_VOLUNTEERS` INT DEFAULT NULL,
  `MAX_COORDINATORS` INT DEFAULT NULL,
  `BROUCHER` LONGTEXT DEFAULT NULL,
  `ATTACHMENTS` LONGTEXT DEFAULT NULL,
  `POST_EVENT_REPORT` TEXT DEFAULT NULL,
  `REPORT_PDF_PATH` VARCHAR(500) DEFAULT NULL,
  `DETAILS_JSON` JSON DEFAULT NULL,
  `REMARKS` VARCHAR(500) DEFAULT NULL,
  `APPROVAL_ROUTE` VARCHAR(500) DEFAULT NULL,
  `APPROVAL_STEP` INT DEFAULT 0,
  `APPROVAL_HISTORY_JSON` JSON DEFAULT NULL,
  `BUDGET` DECIMAL(10,2) DEFAULT 0.00,
  `SUB_EVENT_ID` VARCHAR(255) DEFAULT NULL,
  `SUB_EVENT_NAME` VARCHAR(255) DEFAULT NULL,
  `chat_history` JSON DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($sql)) {
    echo "✅ event_metadata table created successfully in " . DB_NAME . "\n";
} else {
    echo "❌ Error: " . $conn->error . "\n";
}

// Now migrate the data from old DB
$old = new mysqli('localhost', 'root', 'dhanashreessql2025', 'gmu_events', 3306);
$old->set_charset('utf8mb4');

$res = $old->query("SELECT * FROM event_metadata");
$count = $skip = 0;

function esc2($conn, $val) {
    if ($val === null) return 'NULL';
    return "'" . $conn->real_escape_string((string)$val) . "'";
}

while ($r = $res->fetch_assoc()) {
    $eid = (int)($r['EVENT_ID'] ?? 0);
    if (!$eid) { $skip++; continue; }

    $sql2 = "INSERT IGNORE INTO event_metadata
        (EVENT_ID, REGISTRATION_DEADLINE, MAX_PARTICIPANTS, MAX_VOLUNTEERS, MAX_COORDINATORS, MAX_TEAM_SIZE, BUDGET, APPROVAL_STEP, DETAILS_JSON, APPROVAL_HISTORY_JSON, BROUCHER, REMARKS)
        VALUES (" .
        esc2($conn, $eid) . "," .
        esc2($conn, $r['REGISTRATION_DEADLINE'] ?? null) . "," .
        esc2($conn, $r['MAX_PARTICIPANTS'] ?? null) . "," .
        esc2($conn, $r['MAX_VOLUNTEERS'] ?? null) . "," .
        esc2($conn, $r['MAX_COORDINATORS'] ?? null) . "," .
        esc2($conn, $r['MAX_TEAM_SIZE'] ?? 1) . "," .
        esc2($conn, (float)($r['BUDGET'] ?? 0)) . "," .
        esc2($conn, (int)($r['APPROVAL_STEP'] ?? 0)) . "," .
        esc2($conn, $r['DETAILS_JSON'] ?? null) . "," .
        esc2($conn, $r['APPROVAL_HISTORY_JSON'] ?? null) . "," .
        esc2($conn, $r['BROUCHER'] ?? null) . "," .
        esc2($conn, $r['REMARKS'] ?? null) . ")";

    if ($conn->query($sql2)) $count++; else $skip++;
}

echo "✅ Migrated event_metadata: $count rows inserted, $skip skipped\n";

$old->close();
$conn->close();
?>
