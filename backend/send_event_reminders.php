<?php
/**
 * backend/send_event_reminders.php
 * Cron job script: sends notifications for upcoming events.
 * Reads event data from event_master, student registrations from event_registrations.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/db.php';
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
    SELECT er.STUDENT_ID AS student_id, em.EVENT AS event_title
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved')
";
$stmtTomorrow = $conn->prepare($sqlTomorrow);
if ($stmtTomorrow) {
    $stmtTomorrow->bind_param('s', $tomorrow);
    $stmtTomorrow->execute();
    $resTomorrow = $stmtTomorrow->get_result();
    $notifStmt   = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
    while ($row = $resTomorrow->fetch_assoc()) {
        $msg = "Reminder: The event '{$row['event_title']}' is happening tomorrow!";
        $notifStmt->bind_param('ss', $row['student_id'], $msg);
        $notifStmt->execute();
    }
    $notifStmt->close();
    $stmtTomorrow->close();
}

// 2 & 3. Check-in window notifications (30 mins / 5 mins before)
$sqlToday = "
    SELECT er.STUDENT_ID AS student_id, em.EVENT AS event_title, em.START_TIME AS event_time
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved') AND er.CHECK_IN_STATUS = 'pending'
";
$stmtToday = $conn->prepare($sqlToday);
if ($stmtToday) {
    $stmtToday->bind_param('s', $today);
    $stmtToday->execute();
    $resToday    = $stmtToday->get_result();
    $notifStmt   = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
    while ($row = $resToday->fetch_assoc()) {
        $eventTimeStr = $row['event_time'];
        if (!$eventTimeStr) continue;
        $eventStart = new DateTime("$today $eventTimeStr", new DateTimeZone('Asia/Kolkata'));
        $diffMins   = ($eventStart->getTimestamp() - $now->getTimestamp()) / 60;
        if ($diffMins <= 30 && $diffMins > 25) {
            $msg = "Check-in is now OPEN for '{$row['event_title']}'! Scan your QR code.";
            $notifStmt->bind_param('ss', $row['student_id'], $msg);
            $notifStmt->execute();
        }
        if ($diffMins <= 5 && $diffMins > 0) {
            $msg = "Hurry! Check-in for '{$row['event_title']}' closes in " . ceil($diffMins) . " minutes!";
            $notifStmt->bind_param('ss', $row['student_id'], $msg);
            $notifStmt->execute();
        }
    }
    $notifStmt->close();
    $stmtToday->close();
}

// 4. Registration Deadline Warnings
$sqlDeadline  = "SELECT SL_NO AS id, EVENT AS event_title, REGISTRATION_DEADLINE FROM event_master WHERE CURRENT_STATUS IN ('published', 'approved') AND REGISTRATION_DEADLINE IS NOT NULL";
$stmtDeadline = $conn->prepare($sqlDeadline);
if ($stmtDeadline) {
    $stmtDeadline->execute();
    $resDeadline = $stmtDeadline->get_result();
    $notifStmt   = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
    $studStmt    = $conn->query("SELECT usn_or_emp_id AS username FROM users WHERE system_role = 'student'");
    $students    = [];
    while ($s = $studStmt->fetch_assoc()) $students[] = $s['username'];
    while ($row = $resDeadline->fetch_assoc()) {
        $deadline = new DateTime($row['REGISTRATION_DEADLINE'], new DateTimeZone('Asia/Kolkata'));
        $diffMins = ($deadline->getTimestamp() - $now->getTimestamp()) / 60;
        if ($diffMins <= 1440 && $diffMins > 1435) {
            $msg = "⏳ Registration for '{$row['event_title']}' closes tomorrow. Secure your spot!";
            foreach ($students as $stud) {
                $notifStmt->bind_param('ss', $stud, $msg);
                $notifStmt->execute();
            }
        }
    }
    $notifStmt->close();
    $stmtDeadline->close();
}

// 5. Post-Event Feedback Reminders
$sqlPast = "
    SELECT er.STUDENT_ID AS student_id, em.EVENT AS event_title, em.START_TIME AS event_time
    FROM event_registrations er
    JOIN event_master em ON er.EVENT_ID = em.SL_NO
    WHERE em.START_DATE = ? AND em.CURRENT_STATUS IN ('published', 'approved') AND er.CHECK_IN_STATUS = 'checked_in'
";
$stmtPast = $conn->prepare($sqlPast);
if ($stmtPast) {
    $stmtPast->bind_param('s', $today);
    $stmtPast->execute();
    $resPast   = $stmtPast->get_result();
    $notifStmt = $conn->prepare("INSERT INTO Notifications (user_id, message, target_link) VALUES (?, ?, '/student-dashboard')");
    while ($row = $resPast->fetch_assoc()) {
        $eventTimeStr = $row['event_time'];
        if (!$eventTimeStr) continue;
        $eventStart = new DateTime("$today $eventTimeStr", new DateTimeZone('Asia/Kolkata'));
        $diffMins   = ($now->getTimestamp() - $eventStart->getTimestamp()) / 60;
        if ($diffMins >= 120 && $diffMins < 125) {
            $msg = "⭐ Thanks for attending '{$row['event_title']}'! Please leave feedback to unlock your certificate.";
            $notifStmt->bind_param('ss', $row['student_id'], $msg);
            $notifStmt->execute();
        }
    }
    $notifStmt->close();
    $stmtPast->close();
}

$conn->close();
echo "Reminders sent successfully.\n";
?>
