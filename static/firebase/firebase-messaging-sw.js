 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 importScripts('https://www.gstatic.com/firebasejs/6.3.3/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/6.3.3/firebase-messaging.js');
 
 // Initialize the Firebase app in the service worker by passing in the
 // messagingSenderId.
 firebase.initializeApp({
   'messagingSenderId': '269534461245'
 });

 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  var notificationTitle = 'Wasabee Update';
  var notificationOptions = {
    body: payload,
    icon: '/static/android-chrome-192x192.png'
  };

  const allClients = clients.MatchAll({
    includeUncontrolled: true
  });
  for (const client of allClients) {
    // const url = new URL(client.url);
    // if (url.pathname == '/intel/' ....
    client.postMessage(payload);
  }

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});
