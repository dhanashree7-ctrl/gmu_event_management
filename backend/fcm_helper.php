<?php
/**
 * backend/fcm_helper.php
 * ─────────────────────────────────────────────────────────────────
 * Helper functions to authenticate with Google OAuth2 and send
 * push notifications via Firebase Cloud Messaging (FCM) HTTP v1 API.
 * ─────────────────────────────────────────────────────────────────
 */

declare(strict_types=1);


require_once __DIR__ . '/config/cors.php';
/**
 * Generates an OAuth2 access token using the Firebase Service Account JSON.
 *
 * @return array{access_token: string, project_id: string}|null
 */
function get_fcm_access_token(): ?array {
    $service_account_json_path = __DIR__ . '/config/firebase-service-account.json';
    if (!file_exists($service_account_json_path)) {
        error_log('[FCM] Service account JSON not found at: ' . $service_account_json_path);
        return null;
    }

    $sa = json_decode(file_get_contents($service_account_json_path), true);
    if (!is_array($sa) || empty($sa['client_email']) || empty($sa['private_key']) || empty($sa['project_id'])) {
        error_log('[FCM] Invalid Service account JSON structure.');
        return null;
    }

    $now = time();
    $claim_set = json_encode([
        'iss'   => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    ]);

    $header_b64  = rtrim(strtr(base64_encode('{"alg":"RS256","typ":"JWT"}'), '+/', '-_'), '=');
    $claim_b64   = rtrim(strtr(base64_encode((string)$claim_set), '+/', '-_'), '=');
    $sig_input   = $header_b64 . '.' . $claim_b64;
    $private_key = openssl_pkey_get_private($sa['private_key']);
    if (!$private_key) {
        error_log('[FCM] Failed to parse private key from service account.');
        return null;
    }

    $signature = '';
    openssl_sign($sig_input, $signature, $private_key, 'SHA256');
    $sig_b64 = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    $jwt     = $sig_input . '.' . $sig_b64;

    $oauth_ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($oauth_ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
    ]);

    $oauth_resp = curl_exec($oauth_ch);
    $http_code  = curl_getinfo($oauth_ch, CURLINFO_HTTP_CODE);
    curl_close($oauth_ch);

    if ($http_code !== 200 || !$oauth_resp) {
        error_log("[FCM] Failed to get OAuth2 token (HTTP $http_code): $oauth_resp");
        return null;
    }

    $oauth_data = json_decode((string)$oauth_resp, true);
    $access_token = $oauth_data['access_token'] ?? '';
    if (!$access_token) {
        return null;
    }

    return [
        'access_token' => $access_token,
        'project_id'   => $sa['project_id'],
    ];
}

/**
 * Sends an FCM push notification to a specific device registration token.
 *
 * @param string $device_token
 * @param string $title
 * @param string $body
 * @param string $link
 * @return bool
 */
function send_fcm_notification(string $device_token, string $title, string $body, string $link = '/', ?string $target_username = null, ?string $target_role = null): bool {
    $device_token = trim($device_token);
    if ($device_token === '') return false;

    $auth = get_fcm_access_token();
    if (!$auth) return false;

    $url = "https://fcm.googleapis.com/v1/projects/{$auth['project_id']}/messages:send";

    $payload = json_encode([
        'message' => [
            'token'        => $device_token,
            'notification' => [
                'title' => $title,
                'body'  => $body,
            ],
            'webpush' => [
                'fcm_options' => [
                    'link' => $link,
                ],
            ],
            'data' => [
                'target_username' => (string)$target_username,
                'target_role'     => (string)$target_role,
            ]
        ],
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $auth['access_token'],
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS     => $payload,
    ]);

    $response  = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        error_log("[FCM] Send failed (HTTP $http_code): $response");
        return false;
    }

    return true;
}

/**
 * Sends an FCM push notification to a user by USER_NAME.
 *
 * @param mysqli $conn
 * @param string $USER_NAME
 * @param string $title
 * @param string $body
 * @param string $link
 * @return bool
 */
function send_fcm_to_user(mysqli $conn, string $USER_NAME, string $title, string $body, string $link = '/'): bool {
    $stmt = $conn->prepare("SELECT device_token FROM users WHERE USER_NAME = ? AND device_token IS NOT NULL AND device_token != '' LIMIT 1");
    if (!$stmt) return false;
    $stmt->bind_param('s', $USER_NAME);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!empty($row['device_token'])) {
        return send_fcm_notification($row['device_token'], $title, $body, $link, $USER_NAME);
    }
    return false;
}



