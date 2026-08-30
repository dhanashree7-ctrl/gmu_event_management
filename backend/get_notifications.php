<?php
/**
 * backend/get_notifications.php
 *
 * [MIGRATED] The legacy `Notifications` SQL table has been removed.
 * Notifications are now delivered via Firebase Cloud Messaging (FCM) push
 * and managed entirely in the client-side NotificationBell component.
 *
 * This endpoint returns an empty array so any legacy callers do not crash.
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

echo json_encode(['success' => true, 'data' => [], 'message' => 'Notifications are now delivered via Firebase FCM push.']);