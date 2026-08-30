// public/firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────
// Firebase Cloud Messaging Service Worker
//
// This file MUST live in the /public directory so the browser can
// register it at the root scope (/firebase-messaging-sw.js).
//
// It handles BACKGROUND push messages — i.e. when the user has the
// app tab closed or minimised. The foreground case is handled inside
// useFCMNotifications.js via onMessage().
// ─────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ── Initialize Firebase inside the service worker ────────────────
firebase.initializeApp({
  apiKey:            'AIzaSyDna2_10bCCxvhCICcR7odTs-LNUX-QYQw',
  authDomain:        'gmu-event-management.firebaseapp.com',
  projectId:         'gmu-event-management',
  storageBucket:     'gmu-event-management.firebasestorage.app',
  messagingSenderId: '415410133964',
  appId:             '1:415410133964:web:59fe0a3b3ae5843faadb69',
});

const messaging = firebase.messaging();

// ── Background message handler ───────────────────────────────────
// Triggered when the app is NOT in the foreground.
// The browser will show a native OS notification automatically
// using the title/body from the FCM payload.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message received:', payload);

  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || 'GMU Events', {
    body:  body  || 'You have a new notification.',
    icon:  icon  || '/logo192.png',   // App icon in /public
    badge: '/logo192.png',
    data:  payload.data || {},
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });

  // Broadcast to open tabs so their Bell icon updates
  clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
    for (const client of windowClients) {
      client.postMessage({
        type: 'FCM_BACKGROUND_MESSAGE',
        payload: payload
      });
    }
  });
});

// ── Notification click handler ───────────────────────────────────
// When the user clicks the OS notification, focus the app window
// or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.target_link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app window is already open, focus it and navigate.
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
