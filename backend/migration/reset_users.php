<?php
require_once __DIR__ . '/../config/db.php';

try {
    $conn = get_db_connection();
    $conn->autocommit(FALSE);

    echo "Deleting all users...\n";
    $conn->query("DELETE FROM users");
    $conn->query("ALTER TABLE users AUTO_INCREMENT = 1");

    $defaultPassword = password_hash('pass123', PASSWORD_BCRYPT);

    $stmt = $conn->prepare("INSERT INTO users (username, full_name, email, password, system_role, role, department, faculty_name, school_name, usn_or_emp_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");

    function insertUser($stmt, $username, $role, $dept, $fac, $sch, $usn, $defaultPassword) {
        $email = $username . '@gmu.ac.in';
        $sysRole = $role;
        if ($role === 'events_admin') $sysRole = 'events_admin';
        else if ($role === 'director_sa') $sysRole = 'admin'; // mapping to admin maybe? Wait, schema has events_admin, admin, student, faculty, hod, director, dean, pro_vc, vc
        
        $fullName = ucfirst($username);
        $stmt->bind_param("ssssssssss", $username, $fullName, $email, $defaultPassword, $sysRole, $role, $dept, $fac, $sch, $usn);
        if (!$stmt->execute()) {
             echo "Error inserting $username: " . $stmt->error . "\n";
        }
    }

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

    // Global Roles
    insertUser($stmt, 'vc', 'vc', null, null, null, 'VC001', $defaultPassword);
    insertUser($stmt, 'pro_vc', 'pro_vc', null, null, null, 'PVC001', $defaultPassword);
    insertUser($stmt, 'director_sa', 'student_affairs', null, null, null, 'DIRSA001', $defaultPassword);
    insertUser($stmt, 'events_admin', 'events_admin', null, null, null, 'EVTADM001', $defaultPassword);

    function getShortCode($str) {
        $map = [
            'Faculty of Engineering & Technology (FET)' => 'fet',
            'Faculty of Commerce and Management (FCM)' => 'fcm',
            'Faculty of Computing and IT (FCIT)' => 'fcit',
            'GM Business School (GMBS)' => 'gmbs',
            'GM School of Law (GMSL)' => 'gmsl',
            'School of Engineering (SE)' => 'se',
            'School of Computer Science and Technology (SCST)' => 'scst',
            'School of Commerce' => 'sc',
            'School of Management' => 'sm',
            'School of Computer Applications (SCA)' => 'sca',
            'School of Computer Science (SCS)' => 'scs',
            'GMBS' => 'gmbs',
            'GMSL' => 'gmsl'
        ];
        if (isset($map[$str])) return $map[$str];
        
        // for departments
        $str = preg_replace('/[^a-zA-Z]/', '', $str);
        return strtolower(substr($str, 0, 4));
    }
    
    function getDeptCode($str) {
         $map = [
            'ECE' => 'EC', 'EEE' => 'EE', 'Civil' => 'CV', 'Mech' => 'ME', 'RA' => 'RA', 'ED' => 'ED',
            'CSE' => 'CS', 'AIML' => 'AI', 'ISE' => 'IS', 'IOT' => 'IO', 'Cyber Security' => 'CY',
            'DS' => 'DS', 'Cloud Comp' => 'CC', 'CCBS' => 'CB',
            'B.Com General' => 'BCG', 'B.Com Accounting and Finance' => 'BCAF',
            'B.Com Accounting and Taxation' => 'BCAT', 'B.Com Data Analytics and Business Intelligence' => 'BCDA',
            'B.Com AI & Business Analytics' => 'BCAI', 'M.Com' => 'MCOM',
            'BBA General' => 'BBG', 'BBA Digital Marketing' => 'BBDM', 'BBA AI & Business Analytics' => 'BBAI',
            'BBA Blockchain/Fintech' => 'BBBF', 'BBA Tourism/Hospitality' => 'BBTH', 'BBA Aviation' => 'BBAV',
            'BBA Healthcare' => 'BBHC', 'MBA General' => 'MBAG', 'MBA Ag Marketing' => 'MBAM',
            'MBA Innovation/Entrepreneurship' => 'MBAI',
            'BCA General' => 'BCAG', 'BCA AI/Data Analytics' => 'BCAA', 'BCA Data Science' => 'BCAD',
            'BCA Cyber Security' => 'BCAC', 'MCA General' => 'MCAG', 'MCA AI/Data Analytics' => 'MCAA',
            'MCA Data Science' => 'MCAD', 'MCA Cyber Security' => 'MCAC',
            'M.Sc Data Science' => 'MSDS', 'M.Sc AI/Data Analytics' => 'MSAA', 'M.Sc Cyber Security' => 'MSCS',
            'MBA Programs' => 'MBA',
            '3-Year LLB' => 'LLB3', 'B.A. LL.B' => 'BALLB', 'B.B.A. LL.B' => 'BBALLB', 'B.Com. LL.B' => 'BCOLLB'
         ];
         if (isset($map[$str])) return $map[$str];
         return strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $str), 0, 2));
    }

    $usnCounter = 1;

    foreach ($hierarchy as $faculty => $schools) {
        $deanName = 'dean_' . getShortCode($faculty);
        insertUser($stmt, $deanName, 'dean', null, $faculty, null, 'DEAN_' . strtoupper(getShortCode($faculty)), $defaultPassword);

        foreach ($schools as $school => $branches) {
            $directorName = 'director_' . getShortCode($school);
            insertUser($stmt, $directorName, 'director', null, $faculty, $school, 'DIR_' . strtoupper(getShortCode($school)), $defaultPassword);

            foreach ($branches as $branch) {
                // HOD
                $deptSafe = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $branch));
                $hodName = 'hod_' . $deptSafe;
                insertUser($stmt, $hodName, 'hod', $branch, $faculty, $school, 'HOD_' . strtoupper(getDeptCode($branch)), $defaultPassword);

                // Faculty
                $facName = 'fac_' . $deptSafe;
                insertUser($stmt, $facName, 'faculty', $branch, $faculty, $school, 'FAC_' . strtoupper(getDeptCode($branch)), $defaultPassword);

                // 3 Students
                $dCode = getDeptCode($branch);
                for ($i = 1; $i <= 3; $i++) {
                    $usn = 'GM' . $dCode . sprintf("%02d", $i);
                    $studentName = strtolower($usn);
                    insertUser($stmt, $studentName, 'student', $branch, $faculty, $school, $usn, $defaultPassword);
                }
            }
        }
    }

    $conn->commit();
    echo "Successfully updated database with the exact requested structure!\n";

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo "Error: " . $e->getMessage() . "\n";
} finally {
    if (isset($conn)) $conn->close();
}
?>
