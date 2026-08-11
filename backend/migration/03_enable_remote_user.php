<?php
/**
 * 03_enable_remote_user.php
 * ─────────────────────────────────────────────────────────────────────────
 * Creates a MySQL user that your PARTNER can use to connect remotely.
 * 
 * Run once: http://localhost:8080/backend/migration/03_enable_remote_user.php
 *
 * ⚠️  After running this, your partner needs:
 *    Host:     <your LAN IP address, e.g. 192.168.1.x>
 *    Port:     3306
 *    User:     gmu_partner
 *    Password: GMU_Partner_2026!
 *    Database: GMU_Events01
 * ─────────────────────────────────────────────────────────────────────────
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

$DB_HOST      = 'localhost';
$DB_PORT      = 3306;
$DB_USER      = 'root';
$DB_PASS      = 'dhanashreessql2025';
$PARTNER_USER = 'gmu_partner';
$PARTNER_PASS = 'GMU_Partner_2026!';
$SHARED_DB    = 'GMU_Events01';

echo "<pre style='font-family:monospace;font-size:14px;'>";
echo "╔═══════════════════════════════════════════════════════╗\n";
echo "║     Enabling Remote MySQL Access for Partner         ║\n";
echo "╚═══════════════════════════════════════════════════════╝\n\n";

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, 'mysql', $DB_PORT);
if ($conn->connect_errno) {
    die("❌ Cannot connect as root: " . $conn->connect_error);
}
echo "✅ Connected as root\n\n";

// Create partner user who can connect from any host on the LAN
$queries = [
    "CREATE USER IF NOT EXISTS '$PARTNER_USER'@'%' IDENTIFIED BY '$PARTNER_PASS'",
    "GRANT ALL PRIVILEGES ON `$SHARED_DB`.* TO '$PARTNER_USER'@'%'",
    "FLUSH PRIVILEGES",
];

foreach ($queries as $q) {
    if ($conn->query($q)) {
        echo "✅ $q\n";
    } else {
        echo "❌ Failed: " . $conn->error . "\n   Query: $q\n";
    }
}

// Detect this machine's LAN IP
$lan_ip = gethostbyname(gethostname());

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════╗\n";
echo "║              ✅ Partner Connection Details                   ║\n";
echo "╠═══════════════════════════════════════════════════════════════╣\n";
echo "║  Give these to your partner:                                 ║\n";
echo "║                                                               ║\n";
echo "║  MySQL Host:     $lan_ip  (your LAN IP)         ║\n";
echo "║  MySQL Port:     3306                                         ║\n";
echo "║  MySQL User:     $PARTNER_USER                                 ║\n";
echo "║  MySQL Password: $PARTNER_PASS                         ║\n";
echo "║  MySQL Database: $SHARED_DB                                ║\n";
echo "║                                                               ║\n";
echo "║  ⚠️  Windows Firewall: Make sure port 3306 is allowed!       ║\n";
echo "╚═══════════════════════════════════════════════════════════════╝\n";
echo "</pre>";

$conn->close();
?>
