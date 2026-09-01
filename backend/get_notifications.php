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

require_once __DIR__ . '/config/cors.php';
header('Content-Type: application/json; charset=utf-8');




if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

echo json_encode(['success' => true, 'data' => [], 'message' => 'Notifications are now delivered via Firebase FCM push.']);

