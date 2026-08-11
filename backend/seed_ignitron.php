<?php
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    $conn->autocommit(FALSE);

    echo "Starting Ignitron Seeder...\n";

    // Sub-Events List
    $subEvents = ["Robo Wars", "Codeathon", "Battle of Bands", "Hackathon", "Debate", "Gaming", "Photography", "Dance Off"];

    // 1. Insert Master Event
    $detailsJson = json_encode([
        'is_festival' => true,
        'sub_events' => $subEvents,
        'duration_days' => 2
    ]);

    $stmtMaster = $conn->prepare("INSERT INTO event_registrations (event_title, event_date, report_file_path, IS_ADMIN_POST, details_json) VALUES (?, ?, ?, 1, ?)");
    $title = "Ignitron 2026";
    $date = "2026-10-10 09:00:00";
    $reportPath = "uploads/reports/ignitron_dummy.pdf";
    $stmtMaster->bind_param("ssss", $title, $date, $reportPath, $detailsJson);
    $stmtMaster->execute();
    $masterEventId = $stmtMaster->insert_id;

    // 2. Fetch existing internal users (students)
    $users = [];
    $res = $conn->query("SELECT * FROM users WHERE system_role = 'student'");
    while ($row = $res->fetch_assoc()) {
        $users[] = $row;
    }

    if (empty($users)) {
        throw new Exception("No internal students found to seed. Please run main seeder first.");
    }

    echo "Generating 300+ Ignitron Registrations...\n";
    $stmtReg = $conn->prepare("INSERT INTO event_registrations (EVENT_ID, STUDENT_ID, STUDENT_NAME, USN, EMAIL, ROLE, SEMESTER, event_title, IS_ADMIN_POST, FEEDBACK_RATING, FEEDBACK_COMMENTS, details_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)");

    $externalColleges = ['Bapuji Institute of Engineering and Technology', 'Jain Institute of Technology', 'UBDTCE', 'RV College', 'PES University', 'BMS College of Engineering'];
    $feedbackComments = ['Mind-blowing 2 days!', 'Amazing fest!', 'Loved Robo Wars!', 'Best event ever.', 'Had a lot of fun.', 'Great arrangement.', 'Incredible experience.', 'Could be better organized.'];

    $totalStudents = 350;
    shuffle($users);

    for ($i = 0; $i < $totalStudents; $i++) {
        $isExternal = rand(1, 100) <= 40; // 40% chance of being external
        
        $rating = rand(3, 5); // mostly positive
        $comment = $feedbackComments[array_rand($feedbackComments)];
        
        // Random 1 to 3 sub-events
        shuffle($subEvents);
        $numSubEvents = rand(1, 3);
        $joinedSubEvents = array_slice($subEvents, 0, $numSubEvents);

        if ($isExternal) {
            // Generate dummy external student
            $name = "Ext Student " . ($i + 1);
            $usn = "EXT" . sprintf("%04d", $i);
            $email = "ext" . $i . "@gmail.com";
            $empId = $usn;
            $semester = rand(1, 8);
            $college = $externalColleges[array_rand($externalColleges)];
            
            $json = json_encode([
                'external_college_name' => $college,
                'feedback_text' => $comment,
                'registered_sub_events' => $joinedSubEvents
            ]);

            $role = 'participant';
            
            $stmtReg->bind_param("isssssssiss", $masterEventId, $empId, $name, $usn, $email, $role, $semester, $title, $rating, $comment, $json);
            $stmtReg->execute();

        } else {
            // Use internal student
            if (empty($users)) {
                // If we run out of internal users, skip or break
                continue;
            }
            $u = array_pop($users);
            
            $json = json_encode([
                'registered_sub_events' => $joinedSubEvents,
                'feedback_text' => $comment
            ]);

            $role = 'participant';
            $semester = $u['semester'] ?? rand(1,8);

            $stmtReg->bind_param("isssssssiss", $masterEventId, $u['usn_or_emp_id'], $u['full_name'], $u['usn_or_emp_id'], $u['email'], $role, $semester, $title, $rating, $comment, $json);
            $stmtReg->execute();
        }
    }

    $conn->commit();
    echo "Ignitron successfully seeded!\n";

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) $conn->close();
}
?>
