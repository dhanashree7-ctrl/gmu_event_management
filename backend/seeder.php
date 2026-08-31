<?php

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    $conn->autocommit(FALSE);

    echo "Starting Database Seeder...\n";

    // Step 1: Alter the users table
    echo "Altering users table...\n";
    $alterQueries = [
        "ALTER TABLE users ADD COLUMN faculty_name VARCHAR(255) NULL;",
        "ALTER TABLE users ADD COLUMN school_name VARCHAR(255) NULL;"
    ];

    foreach ($alterQueries as $query) {
        try {
            $conn->query($query);
        } catch (Exception $e) {
            if (!str_contains($e->getMessage(), "Duplicate column")) {
                echo "Warning on alter: " . $e->getMessage() . "\n";
            }
        }
    }

    // Step 2 & 3: Hierarchy and Data Generation
    $hierarchy = [
        'Faculty of Engineering & Technology (FET)' => [
            'School of Engineering (SE)' => ['ECE', 'EEE', 'Civil', 'Mech', 'RA', 'ED'],
            'School of Computer Science and Technology (SCST)' => ['CSE', 'AIML', 'ISE', 'IOT', 'Cyber Security', 'DS', 'Cloud Comp', 'CCBS']
        ],
        'Faculty of Commerce and Management (FCM)' => [
            'School of Commerce' => ['B.Com General', 'B.Com Accounting and Finance', 'B.Com Accounting and Taxation', 'B.Com Data Analytics and Business Intelligence', 'B.Com AI & Business Analytics', 'M.Com'],
            'School of Management' => ['BBA General', 'BBA Digital Marketing', 'BBA AI & Business Analytics', 'BBA Blockchain/Fintech', 'BBA Tourism/Hospitality', 'BBA Aviation', 'BBA Healthcare', 'MBA General', 'MBA Ag Marketing', 'MBA Innovation/Entrepreneurship']
        ],
        'Faculty of Computing and IT (FCIT)' => [
            'School of Computer Applications (SCA)' => ['BCA General', 'BCA AI/Data Analytics', 'BCA Data Science', 'BCA Cyber Security', 'MCA General', 'MCA AI/Data Analytics', 'MCA Data Science', 'MCA Cyber Security'],
            'School of Computer Science (SCS)' => ['M.Sc Data Science', 'M.Sc AI/Data Analytics', 'M.Sc Cyber Security']
        ],
        'GM Business School (GMBS)' => [
            'GMBS' => ['MBA Programs']
        ],
        'GM School of Law (GMSL)' => [
            'GMSL' => ['3-Year LLB', 'B.A. LL.B', 'B.B.A. LL.B', 'B.Com. LL.B']
        ]
    ];

    $firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Arjun', 'Siddharth', 'Rahul', 'Rohan', 'Amit', 'Vikram', 'Diya', 'Ananya', 'Aadhya', 'Kiara', 'Isha', 'Riya', 'Priya', 'Sneha', 'Neha', 'Pooja', 'Karan', 'Rishabh', 'Aryan', 'Kavya', 'Nisha'];
    $lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Rao', 'Desai', 'Joshi', 'Verma', 'Reddy', 'Menon', 'Nair', 'Bhat', 'Gowda', 'Iyer', 'Pillai', 'Chauhan', 'Gupta', 'Mehta', 'Kulkarni', 'Naidu'];

    function getRandomName($firstNames, $lastNames) {
        return $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
    }

    $defaultPassword = password_hash('pass123', PASSWORD_DEFAULT);
    
    // Clear existing dummy data if needed (optional, uncomment to start fresh)
    $conn->query("DELETE FROM users");
    $conn->query("DELETE FROM event_registrations");

    echo "Generating Users...\n";
    
    $stmtUser = $conn->prepare("INSERT INTO users (full_name, email, password, system_role, department, faculty_name, school_name, usn_or_emp_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    $generatedUsers = [];

    // 5 Hardcoded Proposers
    $proposers = [
        ['name' => 'Alice Sharma', 'email' => 'alice@proposer.com', 'dept' => 'CSE', 'faculty' => 'Faculty of Engineering & Technology (FET)', 'school' => 'School of Computer Science and Technology (SCST)', 'emp' => 'PRO001'],
        ['name' => 'Bob Patel', 'email' => 'bob@proposer.com', 'dept' => 'AIML', 'faculty' => 'Faculty of Engineering & Technology (FET)', 'school' => 'School of Computer Science and Technology (SCST)', 'emp' => 'PRO002'],
        ['name' => 'Charlie Singh', 'email' => 'charlie@proposer.com', 'dept' => 'Mech', 'faculty' => 'Faculty of Engineering & Technology (FET)', 'school' => 'School of Engineering (SE)', 'emp' => 'PRO003'],
        ['name' => 'Diana Rao', 'email' => 'diana@proposer.com', 'dept' => 'Civil', 'faculty' => 'Faculty of Engineering & Technology (FET)', 'school' => 'School of Engineering (SE)', 'emp' => 'PRO004'],
        ['name' => 'Evan Desai', 'email' => 'evan@proposer.com', 'dept' => 'ECE', 'faculty' => 'Faculty of Engineering & Technology (FET)', 'school' => 'School of Engineering (SE)', 'emp' => 'PRO005'],
    ];

    $roleFaculty = 'faculty';
    foreach ($proposers as $p) {
        $stmtUser->bind_param("ssssssss", $p['name'], $p['email'], $defaultPassword, $roleFaculty, $p['dept'], $p['faculty'], $p['school'], $p['emp']);
        $stmtUser->execute();
        $generatedUsers[] = [
            'id' => $stmtUser->insert_id,
            'name' => $p['name'],
            'email' => $p['email'],
            'role' => $roleFaculty,
            'usn' => null,
            'usn_or_emp_id' => $p['emp'],
            'semester' => null,
            'department' => $p['dept']
        ];
    }

    $usnCounter = 1;
    $staffCounter = 1;

    foreach ($hierarchy as $faculty => $schools) {
        foreach ($schools as $school => $branches) {
            foreach ($branches as $branch) {
                // Determine number of students
                $numStudents = ($school === 'GMBS') ? 10 : 5;
                
                // Students
                for ($i = 0; $i < $numStudents; $i++) {
                    $name = getRandomName($firstNames, $lastNames);
                    $usn = 'GMU' . date('y') . strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $branch), 0, 2)) . sprintf("%03d", $usnCounter++);
                    $email = strtolower($usn) . '@gmu.ac.in';
                    $role = 'student';
                    
                    $stmtUser->bind_param("ssssssss", $name, $email, $defaultPassword, $role, $branch, $faculty, $school, $usn);
                    $stmtUser->execute();
                    $userId = $stmtUser->insert_id;
                    
                    $generatedUsers[] = [
                        'id' => $userId,
                        'name' => $name,
                        'email' => $email,
                        'role' => $role,
                        'usn' => $usn,
                        'usn_or_emp_id' => $usn,
                        'semester' => rand(1, 8),
                        'department' => $branch
                    ];
                }
                
                // Faculty/Staff
                $numFaculty = 3;
                for ($i = 0; $i < $numFaculty; $i++) {
                    $name = getRandomName($firstNames, $lastNames);
                    $email = strtolower(str_replace(' ', '.', $name)) . $staffCounter++ . '@gmu.ac.in';
                    $role = 'faculty';
                    $empId = 'EMP' . date('y') . sprintf("%04d", $staffCounter);
                    
                    $stmtUser->bind_param("ssssssss", $name, $email, $defaultPassword, $role, $branch, $faculty, $school, $empId);
                    $stmtUser->execute();
                    $userId = $stmtUser->insert_id;
                    
                    $generatedUsers[] = [
                        'id' => $userId,
                        'name' => $name,
                        'email' => $email,
                        'role' => $role,
                        'usn' => null,
                        'usn_or_emp_id' => $empId,
                        'semester' => null,
                        'department' => $branch
                    ];
                }
            }
        }
    }
    
    // Step 4: Event Registration Seeding (STI Architecture)
    echo "Generating Master Events and Registrations...\n";
    
    $masterEvents = [
        ['title' => 'Tech Symposium 2026', 'date' => '2026-09-15 10:00:00'],
        ['title' => 'National Moot Court', 'date' => '2026-10-20 09:30:00'],
        ['title' => 'AI Innovation Hackathon', 'date' => '2026-11-05 08:00:00'],
        ['title' => 'Global Business Conclave', 'date' => '2026-12-12 10:00:00'],
        ['title' => 'Annual Cultural Fest - Utsav', 'date' => '2027-01-25 18:00:00']
    ];
    
    // We use the actual table name based on what we found in get_admin_report_data.php
    $stmtMasterEvent = $conn->prepare("INSERT INTO event_registrations (event_title, event_date, report_file_path, IS_ADMIN_POST) VALUES (?, ?, 'uploads/reports/dummy_report.pdf', 1)");
    $stmtRegistration = $conn->prepare("INSERT INTO event_registrations (EVENT_ID, STUDENT_ID, STUDENT_NAME, USN, EMAIL, ROLE, SEMESTER, event_title, IS_ADMIN_POST, FEEDBACK_RATING, FEEDBACK_COMMENTS, details_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)");
    
    foreach ($masterEvents as $event) {
        $stmtMasterEvent->bind_param("ss", $event['title'], $event['date']);
        $stmtMasterEvent->execute();
        $masterEventId = $stmtMasterEvent->insert_id;
        
        // Randomly select 30-40 diverse users (mostly students, maybe some staff)
        $numAttendees = rand(30, 40);
        shuffle($generatedUsers);
        
        $attendees = array_slice($generatedUsers, 0, $numAttendees);
        
        foreach ($attendees as $attendee) {
            $eventRole = 'participant';
            
            // Random Feedback
            $rating = rand(1, 5);
            $commentsOptions = ['Great event!', 'Very informative', 'Could be better', 'Loved it!', 'Average experience.'];
            $comment = $commentsOptions[array_rand($commentsOptions)];
            
            // Random details_json for 20%
            $detailsJson = null;
            if (rand(1, 100) <= 20) {
                $colleges = ['Bapuji Institute of Engineering', 'UBDT College', 'RV College', 'PES University', 'Jain University'];
                $detailsJson = json_encode([
                    'external_college_name' => $colleges[array_rand($colleges)],
                    'feedback_text' => $comment
                ]);
            }

            $stmtRegistration->bind_param(
                "isssssssiss", 
                $masterEventId, 
                $attendee['usn_or_emp_id'], 
                $attendee['name'], 
                $attendee['usn'], 
                $attendee['email'], 
                $eventRole, 
                $attendee['semester'],
                $event['title'],
                $rating,
                $comment,
                $detailsJson
            );
            $stmtRegistration->execute();
        }
    }

    $conn->commit();
    echo "Seeding completed successfully!\n";

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) $conn->close();
}
?>

