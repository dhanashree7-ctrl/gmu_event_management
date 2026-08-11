<?php
/**
 * backend/setup_college_table.php
 * ---------------------------------------------------------------
 * COMPLETE UNIFICATION SCRIPT. Run once via browser:
 *   http://localhost:8080/backend/setup_college_table.php
 *
 * What this does:
 *   1. Creates the unified event_registrations table.
 *   2. Safely adds capacity columns to EventsMaster (without fatal syntax errors).
 *   3. Migrates any data from EvtReg or EventRegistrations.
 *   4. DROPS the old EvtReg / EventRegistrations tables to prevent confusion.
 * ---------------------------------------------------------------
 */

declare(strict_types=1);
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    die("❌ DB connection failed: " . $e->getMessage());
}

$conn->query("SET foreign_key_checks = 0");

$steps = [];

// ─────────────────────────────────────────────────────────────────────────────
// Helper function for safe column addition (avoids MySQL syntax errors)
// ─────────────────────────────────────────────────────────────────────────────
function addColumnSafely($conn, $table, $column, $definition) {
    $check = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    if ($check && $check->num_rows === 0) {
        if ($conn->query("ALTER TABLE `$table` ADD COLUMN `$column` $definition")) {
            return "✅ Added $column to $table";
        } else {
            return "❌ Failed to add $column to $table: " . $conn->error;
        }
    }
    return "ℹ️  $column already exists in $table";
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Create the unified event_registrations table
// ─────────────────────────────────────────────────────────────────────────────
$create_sql = "CREATE TABLE IF NOT EXISTS event_registrations (
    ID                   INT AUTO_INCREMENT PRIMARY KEY,
    STUDENT_ID           VARCHAR(50)  DEFAULT NULL         COMMENT 'Maps to users.usn_or_emp_id',
    STUDENT_NAME         VARCHAR(200) DEFAULT NULL,
    USN                  VARCHAR(50)  DEFAULT NULL,
    EMAIL                VARCHAR(200) DEFAULT NULL,
    EVENT_ID             VARCHAR(80)  NOT NULL              COMMENT 'EventsMaster.id as string',
    EVENT_NAME           VARCHAR(300) NOT NULL,
    EVENT_DESCRIPTION    TEXT         DEFAULT NULL,
    SUB_EVENT_ID         VARCHAR(80)  DEFAULT NULL,
    SUB_EVENT_NAME       VARCHAR(300) DEFAULT NULL,
    REGISTRATION_DATE    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    STATUS               ENUM('active','completed') DEFAULT 'active',
    ROLE                 ENUM('participant','volunteer','coordinator') DEFAULT 'participant',
    IS_ADMIN_POST        TINYINT(1)   DEFAULT 0,
    CERTIFICATE_URL      VARCHAR(500) DEFAULT NULL,
    FEEDBACK_RATING      TINYINT      DEFAULT NULL          COMMENT '1–5 star rating',
    FEEDBACK_COMMENTS    TEXT         DEFAULT NULL,
    QR_TOKEN             VARCHAR(255) UNIQUE DEFAULT NULL,
    SEMESTER             VARCHAR(50)  DEFAULT NULL,
    SPECIAL_REQUIREMENTS TEXT         DEFAULT NULL,
    TOPICS_OF_INTEREST   TEXT         DEFAULT NULL,
    CHECK_IN_STATUS      ENUM('pending','checked_in') DEFAULT 'pending',
    CHECK_IN_TIME        DATETIME     DEFAULT NULL,
    UNIQUE KEY uq_student_event (STUDENT_ID, EVENT_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

if ($conn->query($create_sql)) {
    $steps[] = "✅ Created / verified unified event_registrations table.";
} else {
    $steps[] = "❌ Create table failed: " . $conn->error;
}

// Make sure new columns are added if table existed before this script
$steps[] = addColumnSafely($conn, 'event_registrations', 'QR_TOKEN', "VARCHAR(255) UNIQUE DEFAULT NULL");
$steps[] = addColumnSafely($conn, 'event_registrations', 'SEMESTER', "VARCHAR(50) DEFAULT NULL");
$steps[] = addColumnSafely($conn, 'event_registrations', 'SPECIAL_REQUIREMENTS', "TEXT DEFAULT NULL");
$steps[] = addColumnSafely($conn, 'event_registrations', 'TOPICS_OF_INTEREST', "TEXT DEFAULT NULL");
$steps[] = addColumnSafely($conn, 'event_registrations', 'CHECK_IN_STATUS', "ENUM('pending','checked_in') DEFAULT 'pending'");
$steps[] = addColumnSafely($conn, 'event_registrations', 'CHECK_IN_TIME', "DATETIME DEFAULT NULL");

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Migrate data from EvtReg or EventRegistrations (if they exist)
// ─────────────────────────────────────────────────────────────────────────────
foreach (['EvtReg', 'EventRegistrations'] as $old_table) {
    $check = $conn->query("SHOW TABLES LIKE '$old_table'");
    if ($check && $check->num_rows > 0) {
        
        // Ensure role column exists before querying to prevent 'unknown column' error
        $role_check = $conn->query("SHOW COLUMNS FROM `$old_table` LIKE 'role'");
        if ($role_check && $role_check->num_rows === 0) {
            $conn->query("ALTER TABLE `$old_table` ADD COLUMN `role` ENUM('participant','volunteer','coordinator') DEFAULT 'participant'");
        }

        $migrate_sql = "
            INSERT IGNORE INTO event_registrations
                (STUDENT_ID, STUDENT_NAME, USN, EMAIL, EVENT_ID, EVENT_NAME,
                 REGISTRATION_DATE, STATUS, ROLE, QR_TOKEN, SEMESTER,
                 SPECIAL_REQUIREMENTS, TOPICS_OF_INTEREST, CHECK_IN_STATUS, CHECK_IN_TIME)
            SELECT
                er.student_id,
                u.full_name,
                u.usn_or_emp_id,
                u.email,
                er.event_id,
                em.event_title,
                er.registered_at,
                CASE WHEN er.check_in_status = 'checked_in' THEN 'completed' ELSE 'active' END,
                IFNULL(er.role, 'participant'),
                er.qr_token,
                er.semester,
                er.special_requirements,
                er.topics_of_interest,
                er.check_in_status,
                er.check_in_time
            FROM $old_table er
            LEFT JOIN users u ON er.student_id = u.usn_or_emp_id OR er.student_id = u.id
            LEFT JOIN EventsMaster em ON er.event_id = em.id
        ";
        if ($conn->query($migrate_sql)) {
            $rows = $conn->affected_rows;
            $steps[] = "✅ Migrated $rows rows from $old_table into event_registrations.";
        } else {
            $steps[] = "⚠️  Migration from $old_table failed: " . $conn->error;
        }

        // DROP the old table!
        if ($conn->query("DROP TABLE `$old_table`")) {
            $steps[] = "🗑️  Dropped redundant table: $old_table";
        }
    }
}

// Migrate feedback from EventFeedback → event_registrations.FEEDBACK_RATING
$ef_check = $conn->query("SHOW TABLES LIKE 'EventFeedback'");
if ($ef_check && $ef_check->num_rows > 0) {
    $fb_migrate = "
        UPDATE event_registrations er
        JOIN EventFeedback ef ON er.EVENT_ID = ef.event_id AND er.STUDENT_ID = ef.student_id
        SET er.FEEDBACK_RATING   = ef.rating,
            er.FEEDBACK_COMMENTS = ef.comments
        WHERE er.FEEDBACK_RATING IS NULL
    ";
    if ($conn->query($fb_migrate)) {
        $steps[] = "✅ Migrated existing EventFeedback rows into event_registrations.";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Add capacity columns safely to EventsMaster
// ─────────────────────────────────────────────────────────────────────────────
$steps[] = addColumnSafely($conn, 'EventsMaster', 'max_participants', 'INT DEFAULT NULL');
$steps[] = addColumnSafely($conn, 'EventsMaster', 'max_volunteers', 'INT DEFAULT NULL');
$steps[] = addColumnSafely($conn, 'EventsMaster', 'max_coordinators', 'INT DEFAULT NULL');

$conn->query("SET foreign_key_checks = 1");
$conn->close();

echo implode("\n", $steps);
echo "\n\n✅ SETUP COMPLETE. You can now test the endpoints.\n";
?>
