<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/config/db.php';
try { $conn = get_db_connection(); } catch (Exception $e) { die("DB Error"); }

// 1. Update users to have school and faculty
$conn->query("UPDATE users SET school_name = 'School of Engineering', faculty_name = 'Faculty of Computer Science' WHERE system_role IN ('faculty', 'hod', 'admin') AND id % 3 = 0");
$conn->query("UPDATE users SET school_name = 'School of Engineering', faculty_name = 'Faculty of Electronics' WHERE system_role IN ('faculty', 'hod', 'admin') AND id % 3 = 1");
$conn->query("UPDATE users SET school_name = 'School of Business', faculty_name = 'Faculty of Management' WHERE system_role IN ('faculty', 'hod', 'admin') AND id % 3 = 2");

// 2. Give some budgets to event_metadata
$conn->query("UPDATE event_metadata SET BUDGET = FLOOR(5000 + (RAND() * 45000)) WHERE BUDGET IS NULL OR BUDGET = 0");

// 3. Mark some event_registrations as checked_in
$conn->query("UPDATE event_registrations SET CHECK_IN_STATUS = 'checked_in' WHERE id % 2 = 0");

// 4. Set details_json to external for some registrations
$external_json = json_encode(['college' => 'External University', 'course' => 'B.Tech']);
$internal_json = json_encode(['college' => 'GM University', 'course' => 'B.Tech']);
$conn->query("UPDATE event_registrations SET details_json = '$external_json' WHERE id % 3 = 0");
$conn->query("UPDATE event_registrations SET details_json = '$internal_json' WHERE id % 3 = 1");

echo "Data updated successfully for executive dashboard.";
$conn->close();
?>
