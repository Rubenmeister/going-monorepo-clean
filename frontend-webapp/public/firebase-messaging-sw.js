/* global importScripts, firebase */
// Service Worker de Firebase Cloud Messaging (web-push).
// Recibe notificaciones en segundo plano y las muestra.
//
// Config pública del proyecto Going (mismos valores que src/app/lib/firebase.ts).
// ⚠️ Para que el web-push funcione hay que tener `appId` real y configurar la
// clave VAPID (NEXT_PUBLIC_FIREBASE_VAPID_KEY) en el cliente.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA0HE8V7Z_9JTjikcQ08ud_p3jx1GJAeEU',
  authDomain: 'going-5d1ae.firebaseapp.com',
  projectId: 'going-5d1ae',
  storageBucket: 'going-5d1ae.firebasestorage.app',
  messagingSenderId: '780842550857',
  appId: self.__GOING_FIREBASE_APP_ID__ || '',
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const n = payload.notification || payload.data || {};
    self.registration.showNotification(n.title || 'Going App', {
      body: n.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: payload.data || {},
    });
  });
} catch (e) {
  // Si messaging no está disponible (config incompleta), el SW no rompe.
}

// Al tocar la notificación, enfoca/abre la app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('/dashboard/pasajero');
    }),
  );
});
