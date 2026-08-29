<?php
require_once __DIR__ . '/config/db.php';

try {
    $conn = get_db_connection();
    
    // Wipe existing admins to avoid duplicate email conflicts
    $conn->query("DELETE FROM users WHERE ROLE IN ('hod', 'director', 'dean', 'provc', 'vc', 'student_affairs', 'events_admin')");

    // Exact hierarchy from seeder.php
    $hierarchy = [
        'Faculty of Engineering & Technology (FET)' => [
            'School of Engineering (SE)' => ['ECE', 'EEE', 'Civil', 'Mech', 'RA', 'ED'],
            'School of Computer Science and Technology (SCST)' => ['CSE', 'AIML', 'ISE', 'IOT', 'Cyber Security', 'DS', 'Cloud Comp', 'CCBS']
        ],
        'Faculty of Commerce and Management (FCM)' => [
            'School of Commerce (SC)' => ['B.Com General', 'B.Com Accounting and Finance', 'B.Com Accounting and Taxation', 'B.Com Data Analytics and Business Intelligence', 'B.Com AI & Business Analytics', 'M.Com'],
            'School of Management (SM)' => ['BBA General', 'BBA Digital Marketing', 'BBA AI & Business Analytics', 'BBA Blockchain/Fintech', 'BBA Tourism/Hospitality', 'BBA Aviation', 'BBA Healthcare', 'MBA General', 'MBA Ag Marketing', 'MBA Innovation/Entrepreneurship']
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

    function getAcronym($name) {
        if (preg_match('/\((.*?)\)/', $name, $matches)) {
            $acronym = strtolower($matches[1]);
            if ($acronym === 'fet') return 'fet'; // requested by user
            return $acronym;
        }
        $words = explode(' ', $name);
        $acronym = '';
        foreach ($words as $w) {
            $acronym .= strtolower($w[0]);
        }
        return $acronym;
    }

    $defaultPassword = password_hash('pass123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (NAME, EMAIL, PASSWORD, ROLE, DEPT, FACULTY, SCHOOL, USERNAME) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    echo "Generating Deans, Directors, and HODs...\n";

    foreach ($hierarchy as $faculty => $schools) {
        $facultyAcronym = getAcronym($faculty);
        $deanId = 'dean_' . $facultyAcronym;
        $deanName = "Dean " . $faculty;
        $email = $deanId . "@gmu.ac.in";
        $role = "dean";
        
        $stmt->bind_param("ssssssss", $deanName, $email, $defaultPassword, $role, $faculty, $faculty, $faculty, $deanId);
        try { $stmt->execute(); } catch (Exception $e) {}

        foreach ($schools as $school => $branches) {
            $schoolAcronym = getAcronym($school);
            // Some schools like GMBS don't need 'director_gmbs' if we just want the acronym
            $directorId = 'director_' . $schoolAcronym;
            $directorName = "Director " . $school;
            $email = $directorId . "@gmu.ac.in";
            $role = "director";

            $stmt->bind_param("ssssssss", $directorName, $email, $defaultPassword, $role, $school, $faculty, $school, $directorId);
            try { $stmt->execute(); } catch (Exception $e) {}

            foreach ($branches as $branch) {
                // format branch safely (e.g. B.Com General -> bcom_general, AI & Business -> ai_business)
                $safeBranch = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', trim(str_replace(['&', '.'], '', $branch))));
                $safeBranch = trim($safeBranch, '_'); // remove trailing underscores
                
                $hodId = 'hod_' . $safeBranch;
                $hodName = "HOD " . $branch;
                $email = $hodId . "@gmu.ac.in";
                $role = "hod";

                $stmt->bind_param("ssssssss", $hodName, $email, $defaultPassword, $role, $branch, $faculty, $school, $hodId);
                try { $stmt->execute(); } catch (Exception $e) {}
            }
        }
    }

    echo "Generating Top Level Admins...\n";
    $topAdmins = [
        ['name' => 'Pro Vice Chancellor', 'id' => 'pro_vc', 'role' => 'provc'],
        ['name' => 'Vice Chancellor', 'id' => 'vc', 'role' => 'vc'],
        ['name' => 'Director Student Affairs', 'id' => 'director_sa', 'role' => 'student_affairs'],
        ['name' => 'Events Administrator', 'id' => 'events_admin', 'role' => 'events_admin']
    ];

    foreach ($topAdmins as $a) {
        $email = $a['id'] . "@gmu.ac.in";
        $empty = 'Administration';
        $stmt->bind_param("ssssssss", $a['name'], $email, $defaultPassword, $a['role'], $empty, $empty, $empty, $a['id']);
        try { $stmt->execute(); } catch (Exception $e) {}
    }

    echo "All administrative hierarchies generated successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
