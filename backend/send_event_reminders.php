<?php
/**
 * backend/send_event_reminders.php
 * Cron job script: sends notifications for upcoming events.
 * Reads event data from event_master, student registrations from event_registrations.
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/fcm_helper.php';
try { $conn = get_db_connection(); }
catch (RuntimeException $e) {
    echo "DB Connection failed: " . $e->getMessage();
    exit;
}

$now         = new DateTime('now', new DateTimeZone('Asia/Kolkata'));
$today       = $now->format('Y-m-d');
$tomorrow    = (clone $now)->modify('+1 day')->format('Y-m-d');
$currentTime = $now->format('H:i:s');

// 1. Day-Before Reminders
$sqlTomorrow = "
    SELECT er.USER_ID AS student_id, em.EVENT_TITLE AS event_title
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved')
";
$stmtTomorrow = $conn->prepare($sqlTomorrow);
if ($stmtTomorrow) {
    $stmtTomorrow->bind_param('s', $tomorrow);
    $stmtTomorrow->execute();
    $resTomorrow = $stmtTomorrow->get_result();
    while ($row = $resTomorrow->fetch_assoc()) {
        $msg = "Reminder: The event '{$row['event_title']}' is happening tomorrow!";
        send_fcm_to_user($conn, $row['student_id'], '⏰ Event Tomorrow', $msg, '/student-dashboard');
    }
    $stmtTomorrow->close();
}

// 2 & 3. Check-in window notifications (30 mins / 5 mins before)
$sqlToday = "
    SELECT er.USER_ID AS student_id, em.EVENT_TITLE AS event_title, em.START_TIME AS event_time
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved') AND er.CHECK_IN_STATUS = 'pending'
";
$stmtToday = $conn->prepare($sqlToday);
if ($stmtToday) {
    $stmtToday->bind_param('s', $today);
    $stmtToday->execute();
    $resToday    = $stmtToday->get_result();
    while ($row = $resToday->fetch_assoc()) {
        $eventTimeStr = $row['event_time'];
        if (!$eventTimeStr) continue;
        $eventStart = new DateTime("$today $eventTimeStr", new DateTimeZone('Asia/Kolkata'));
        $diffMins   = ($eventStart->getTimestamp() - $now->getTimestamp()) / 60;
        if ($diffMins <= 30 && $diffMins > 25) {
            $msg = "Check-in is now OPEN for '{$row['event_title']}'! Scan your QR code.";
            send_fcm_to_user($conn, $row['student_id'], '🎟️ Check-in Open', $msg, '/student-dashboard');
        }
        if ($diffMins <= 5 && $diffMins > 0) {
            $msg = "Hurry! Check-in for '{$row['event_title']}' closes in " . ceil($diffMins) . " minutes!";
            send_fcm_to_user($conn, $row['student_id'], '⚠️ Check-in Closing', $msg, '/student-dashboard');
        }
    }
    $stmtToday->close();
}

// 4. Registration Deadline Warnings
$sqlDeadline  = "SELECT EVENT_ID AS id, EVENT_TITLE AS event_title, REGISTRATION_DEADLINE FROM event_master WHERE CURRENT_STATUS IN ('published', 'approved') AND REGISTRATION_DEADLINE IS NOT NULL";
$stmtDeadline = $conn->prepare($sqlDeadline);
if ($stmtDeadline) {
    $stmtDeadline->execute();
    $resDeadline = $stmtDeadline->get_result();
    $studStmt    = $conn->query("SELECT USERNAME FROM users WHERE ROLE = 'student'");
    $students    = [];
    while ($s = $studStmt->fetch_assoc()) $students[] = $s['USERNAME'];
    while ($row = $resDeadline->fetch_assoc()) {
        $deadline = new DateTime($row['REGISTRATION_DEADLINE'], new DateTimeZone('Asia/Kolkata'));
        $diffMins = ($deadline->getTimestamp() - $now->getTimestamp()) / 60;
        if ($diffMins <= 1440 && $diffMins > 1435) {
            $msg = "⏳ Registration for '{$row['event_title']}' closes tomorrow. Secure your spot!";
            foreach ($students as $stud) {
                send_fcm_to_user($conn, $stud, '⏳ Registration Closing', $msg, '/student-dashboard');
            }
        }
    }
    $stmtDeadline->close();
}

// 5. Post-Event Feedback Reminders
$sqlPast = "
    SELECT er.USER_ID AS student_id, em.EVENT_TITLE AS event_title, em.START_TIME AS event_time
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.EVENT_ID
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved') AND er.CHECK_IN_STATUS = 'checked_in'
";
$stmtPast = $conn->prepare($sqlPast);
if ($stmtPast) {
    $stmtPast->bind_param('s', $today);
    $stmtPast->execute();
    $resPast   = $stmtPast->get_result();
    while ($row = $resPast->fetch_assoc()) {
        $eventTimeStr = $row['event_time'];
        if (!$eventTimeStr) continue;
        $eventStart = new DateTime("$today $eventTimeStr", new DateTimeZone('Asia/Kolkata'));
        $diffMins   = ($now->getTimestamp() - $eventStart->getTimestamp()) / 60;
        if ($diffMins >= 120 && $diffMins < 125) {
            $msg = "⭐ Thanks for attending '{$row['event_title']}'! Please leave feedback to unlock your certificate.";
            send_fcm_to_user($conn, $row['student_id'], '📝 Feedback Requested', $msg, '/student-dashboard');
        }
    }
    $stmtPast->close();
}

$conn->close();
echo "Reminders sent successfully.\n";
?>

