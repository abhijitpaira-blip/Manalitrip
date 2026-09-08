// This runs as a plain script (no bundler), so it uses the compat build via
// importScripts rather than the modular SDK the rest of the app uses.
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// IMPORTANT: fill these in with the SAME values as src/firebase/firebaseConfig.js.
// This file can't import that module, so the values are duplicated here.
firebase.initializeApp({
  apiKey: "AIzaSyAmn6eJDoIcEYJ7v1WOy9gl3fVUWbUt6io",
  authDomain: "himachal-family-trip.firebaseapp.com",
  projectId: "himachal-family-trip",
  storageBucket: "himachal-family-trip.firebasestorage.app",
  messagingSenderId: "181017194041",
  appId: "1:181017194041:web:0a1732bc993821cad867e8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || "Himachal Family Trip";
  const body = (payload.notification && payload.notification.body) || "New activity on the trip site.";
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
