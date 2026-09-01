<?php
/**
 * backend/chat_assistant.php
 * ---------------------------------------------------------------
 * Proxy to a standard LLM (Gemini) that provides event context.
 */

declare(strict_types=1);

require_once __DIR__ . '/config/cors.php';
error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

require_once __DIR__ . '/config/db.php';

// Retrieve user message
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$user_message = $input['message'] ?? $_POST['message'] ?? null;

if (empty($user_message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'message is required.']);
    exit;
}

// 1. Fetch upcoming approved events for context
try {
    $conn = get_db_connection();
} catch (RuntimeException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// current_status = 'published' covers approved/upcoming events in our system
$sql = "SELECT EVENT_TITLE AS event_title, START_DATE AS event_date, START_TIME AS event_time, VENUE AS venue, CATEGORY AS category, SCALE AS event_scale FROM event_master WHERE CURRENT_STATUS IN ('published', 'approved') ORDER BY START_DATE ASC";
$result = $conn->query($sql);

$events_context = "";
if ($result && $result->num_rows > 0) {
    $events_context = "Here is the data for upcoming approved events:\n";
    while ($row = $result->fetch_assoc()) {
        $events_context .= sprintf(
            "- Title: %s | Date: %s | Time: %s | Venue: %s | Category: %s | Scale: %s\n",
            $row['event_title'],
            $row['event_date'],
            $row['event_time'] ?? 'TBD',
            $row['venue'],
            $row['category'],
            $row['event_scale']
        );
    }
} else {
    $events_context = "There are no upcoming approved events at the moment.\n";
}

$conn->close();

// 2. Construct System Prompt
$system_prompt = "You are a helpful university event assistant for GM University. Answer the user's question based ONLY on this current event data:\n\n"
    . $events_context
    . "\nIf the answer isn't in the data, gracefully say you don't know and advise them to check with the organizers. Do not make up information.";

// 3. Connect to LLM API (Google Gemini 3.6 via REST)
// strictly locate and parse the .env file
$env_path = __DIR__ . '/../.env'; // Adjust the '/../' based on where you saved it
$env_variables = parse_ini_file($env_path); 

// Check 1: Did PHP find the file?
if ($env_variables === false) {
    die(json_encode(['success' => false, 'message' => "DEBUG ERROR: PHP cannot find the .env file at this path: " . $env_path]));
}

// Check 2: Did it find the specific key inside the file?
if (empty($env_variables['GEMINI_API_KEY'])) {
    die(json_encode(['success' => false, 'message' => "DEBUG ERROR: Found the .env file, but GEMINI_API_KEY is missing or empty."]));
}

// Success! Assign the key
$api_key = $env_variables['GEMINI_API_KEY'];

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" . $api_key;


$combined_prompt = $system_prompt . "\n\nUser Question:\n" . $user_message;

$payload = [
    "contents" => [
        [
            "parts" => [
                ["text" => $combined_prompt]
            ]
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

// Disable SSL verification for local dev if needed (Not recommended for prod)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);

if ($curl_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'cURL error: ' . $curl_error]);
    exit;
}

$decoded_response = json_decode($response, true);

if ($http_status !== 200) {
    // Return the actual error message from the API to debug why the API key is failing
    $reply = "API Error (Status {$http_status}): " . ($decoded_response['error']['message'] ?? json_encode($decoded_response));
    echo json_encode([
        'success' => true, // Return true so the UI displays the error
        'reply' => $reply
    ]);
    exit;
}

// 4. Parse JSON Response
$reply_text = $decoded_response['candidates'][0]['content']['parts'][0]['text'] ?? "I'm sorry, I couldn't generate a response.";

echo json_encode([
    'success' => true,
    'reply' => $reply_text
]);
?>

