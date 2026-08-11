<?php
require_once __DIR__ . '/../config/db.php';
$conn = get_db_connection();

$rules = [
    [
        'scale_name' => 'department',
        'chain' => ['hod']
    ],
    [
        'scale_name' => 'university',
        'chain' => ['hod', 'dean', 'director']
    ],
    [
        'scale_name' => 'state',
        'chain' => ['hod', 'dean', 'director', 'pro_vc']
    ],
    [
        'scale_name' => 'national',
        'chain' => ['hod', 'dean', 'director', 'pro_vc', 'vc']
    ],
    [
        'scale_name' => 'international',
        'chain' => ['hod', 'dean', 'director', 'pro_vc', 'vc']
    ]
];

$conn->query("TRUNCATE TABLE approval_rules");

foreach ($rules as $r) {
    $scale = $r['scale_name'];
    $chain = json_encode($r['chain']);
    
    $stmt = $conn->prepare("INSERT INTO approval_rules (scale_name, required_chain) VALUES (?, ?)");
    $stmt->bind_param("ss", $scale, $chain);
    $stmt->execute();
}

echo "✅ Seeded " . count($rules) . " event scales into approval_rules.\n";
$conn->close();
?>
