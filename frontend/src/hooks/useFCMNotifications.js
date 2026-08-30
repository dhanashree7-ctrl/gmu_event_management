/**
 * src/hooks/useFCMNotifications.js
 * ─────────────────────────────────────────────────────────────────
 * [FIREBASE MIGRATION — PHASE 4 — ACTIVE]
 *
 * Custom React hook that handles the complete Firebase Cloud Messaging
 * (FCM) web push setup lifecycle:
 *
 *  1. Watches for an authenticated user in AuthContext.
 *  2. Requests browser Notification permission (once per session).
 *  3. Retrieves the FCM registration token via getToken().
 *  4. POSTs the token to our backend (update_fcm_token.php).
 *  5. Listens for foreground FCM messages via onMessage() and
 *     dispatches them as 'fcm_notification' DOM events for NotificationBell.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || '';

/**
 * Registers the FCM token with the PHP backend.
 */
async function registerTokenWithBackend(token, username) {
  try {
    const jwt = sessionStorage.getItem('jwt_token') || localStorage.getItem('jwt_token');
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    const res = await fetch(`${API_BASE}/update_fcm_token.php`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcm_token: token, username }),
    });

    const json = await res.json();
    if (json.success) {
      console.log('✅ [FCM] Token registered with backend:', json.message);
    } else {
      console.warn('⚠️ [FCM] Backend rejected token:', json.message);
    }
  } catch (err) {
    console.error('❌ [FCM] Failed to register token with backend:', err);
  }
}

/**
 * Main hook — call once at the top-level authenticated layout.
 */
export function useFCMNotifications() {
  const { user } = useAuth();
  const hasRequestedRef = useRef(false);
  const unsubscribeRef  = useRef(null);

  useEffect(() => {
    if (!user) {
      hasRequestedRef.current = false;
      return;
    }

    if (hasRequestedRef.current) return;

    if (!VAPID_KEY) {
      console.warn('[FCM] REACT_APP_FIREBASE_VAPID_KEY is not set in .env.');
      return;
    }

    if (!('Notification' in window)) {
      console.warn('[FCM] This browser does not support desktop notifications.');
      return;
    }

    hasRequestedRef.current = true;

    (async () => {
      try {
        // ── Step 1: Request permission ──────────────────────────────
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          console.info('[FCM] Notification permission status:', permission);
          return;
        }

        console.log('[FCM] Notification permission is granted.');

        // ── Step 2: Register service worker & get token ─────────────
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });

        if (!token) {
          console.warn('[FCM] No registration token available.');
          return;
        }

        console.log('[FCM] Registration token obtained:', token.substring(0, 25) + '...');

        // ── Step 3: Send token to backend ───────────────────────────
        const currentUsername = user.username || user.id || user.name;
        await registerTokenWithBackend(token, currentUsername);

        const processPayload = (payload) => {
          const { title, body } = payload.notification || {};
          const { target_username, target_role } = payload.data || {};
          const currentUsername = user.username || user.id || user.name;

          if (target_username && target_username !== currentUsername) {
            console.log(`[FCM] Ignored message meant for ${target_username} (current user is ${currentUsername})`);
            return;
          }
          if (target_role && user.role && target_role.toLowerCase() !== user.role.toLowerCase()) {
            console.log(`[FCM] Ignored message meant for role ${target_role} (current role is ${user.role})`);
            return;
          }

          window.dispatchEvent(
            new CustomEvent('fcm_notification', {
              detail: {
                id:      Date.now(),
                title,
                body:    body || title || 'New notification',
              },
            })
          );
        };

        const fcmChannel = new BroadcastChannel('fcm_channel');
        fcmChannel.onmessage = (event) => {
          console.log('🔔 [FCM] Cross-tab push received:', event.data);
          processPayload(event.data);
        };
        window.__fcm_channel = fcmChannel;

        // ── Step 4: Listen for foreground messages ──────────────────
        unsubscribeRef.current = onMessage(messaging, (payload) => {
          console.log('🔔 [FCM] Foreground push received:', payload);
          // Broadcast to other background tabs so they don't miss it
          fcmChannel.postMessage(payload);
          // Process in this foreground tab
          processPayload(payload);
        });

        // ── Step 5: Listen for background messages forwarded by SW ──
        const handleBackgroundMessage = (event) => {
          if (event.data && event.data.type === 'FCM_BACKGROUND_MESSAGE') {
            console.log('🔔 [FCM] Background push forwarded to UI:', event.data.payload);
            processPayload(event.data.payload);
          }
        };

        navigator.serviceWorker.addEventListener('message', handleBackgroundMessage);
        
        // Save to ref for cleanup
        window.__fcm_sw_listener = handleBackgroundMessage;

      } catch (err) {
        console.error('❌ [FCM] Setup error:', err);
      }
    })();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (window.__fcm_sw_listener) {
        navigator.serviceWorker.removeEventListener('message', window.__fcm_sw_listener);
        window.__fcm_sw_listener = null;
      }
      if (window.__fcm_channel) {
        window.__fcm_channel.close();
        window.__fcm_channel = null;
      }
    };

  }, [user]);
}

/**
 * Manually request token and permission on user interaction.
 */
export async function manualRequestFcmToken(user) {
  if (!('Notification' in window)) return false;
  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission === 'denied') {
      alert("Push notifications are blocked in your browser. Please click the lock icon in the address bar to allow notifications for this site, then try again.");
      return false;
    }
    if (permission !== 'granted') return false;

    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    
    if (token) {
      const currentUsername = user.username || user.id || user.name;
      await registerTokenWithBackend(token, currentUsername);
      return true;
    }
    return false;
  } catch (err) {
    console.error('❌ [FCM] Manual setup error:', err);
    alert(`Failed to enable notifications: ${err.message || err}`);
    return false;
  }
}
