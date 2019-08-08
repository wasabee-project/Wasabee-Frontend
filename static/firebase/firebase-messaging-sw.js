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

messaging.setBackgroundMessageHandler(async function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // If we actually want to show a notification, Customize it here
  // var notificationTitle = 'Wasabee Update';
  // var notificationOptions = {
  //   body: payload,
  //   icon: '/static/android-chrome-192x192.png'
  // };

  const allClients = await clients.MatchAll({
    includeUncontrolled: true
  });
  if(allClients.length === 0) {
    self.registration.unregister();
  } else {
    for (const client of allClients) {
      client.postMessage(payload);
    }
  }

  // If we actually want to show a notification that the user could interact with...
  // return await self.registration.showNotification(notificationTitle,
  //   notificationOptions);
});
