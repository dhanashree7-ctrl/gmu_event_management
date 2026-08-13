<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

// 1. Get all completed events
$result = $conn->query("SELECT SL_NO FROM event_master WHERE CURRENT_STATUS = 'completed'");
$completed_events = [];
while ($row = $result->fetch_assoc()) {
    $completed_events[] = (int)$row['SL_NO'];
}

if (empty($completed_events)) {
    echo "No completed events found.\n";
    exit;
}

echo "Found completed events: " . implode(', ', $completed_events) . "\n";

// 2. Update event_metadata with dummy reports
$dummy_report_text = "This event was executed successfully. All sub-events concluded on time, and participant feedback was overwhelmingly positive. Budget utilization was optimal, and the final outcomes exceeded the initial objectives.";
$dummy_pdf_path = "dummy_report.pdf";

$stmt = $conn->prepare("UPDATE event_metadata SET POST_EVENT_REPORT = ?, REPORT_PDF_PATH = ? WHERE EVENT_ID = ?");
foreach ($completed_events as $event_id) {
    $stmt->bind_param('ssi', $dummy_report_text, $dummy_pdf_path, $event_id);
    $stmt->execute();
    echo "Updated metadata for event $event_id\n";
}
$stmt->close();

// 3. Add dummy registrations and feedback
$dummy_students = ['GMBCAT01', 'GMBCDA01', 'GMBCAI01', 'GMCS01'];
$comments_list = [
    "Great event, learned a lot!",
    "Well organized and very informative.",
    "The sessions were a bit long but overall good.",
    "Amazing experience, looking forward to the next one.",
    "Good speakers and relevant topics.",
    "Could have had better catering, but the content was top-notch."
];

$check_stmt = $conn->prepare("SELECT ID FROM event_registrations WHERE EVENT_ID = ? AND STUDENT_ID = ?");
$update_stmt = $conn->prepare("UPDATE event_registrations SET FEEDBACK_RATING = ?, FEEDBACK_COMMENTS = ?, attendance_status = 'Attended', attended = 1, CHECK_IN_STATUS = 'checked_in' WHERE ID = ?");
$insert_stmt = $conn->prepare("INSERT INTO event_registrations (STUDENT_ID, EVENT_ID, STATUS, ROLE, FEEDBACK_RATING, FEEDBACK_COMMENTS, attendance_status, attended, CHECK_IN_STATUS) VALUES (?, ?, 'active', 'participant', ?, ?, 'Attended', 1, 'checked_in')");

foreach ($completed_events as $event_id) {
    foreach ($dummy_students as $student) {
        $check_stmt->bind_param('is', $event_id, $student);
        $check_stmt->execute();
        $res = $check_stmt->get_result();
        
        $rating = rand(3, 5);
        $comment = $comments_list[array_rand($comments_list)];

        if ($row = $res->fetch_assoc()) {
            $reg_id = $row['ID'];
            $update_stmt->bind_param('isi', $rating, $comment, $reg_id);
            $update_stmt->execute();
        } else {
            $insert_stmt->bind_param('siis', $student, $event_id, $rating, $comment);
            $insert_stmt->execute();
        }
    }
    echo "Added feedback for event $event_id\n";
}

echo "Successfully generated dummy data.\n";
$conn->close();
?>
