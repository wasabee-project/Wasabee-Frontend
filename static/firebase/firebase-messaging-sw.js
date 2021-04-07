// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.3.2/firebase-messaging.js');
 
// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyDfGX11zg-3s79hd5Kzbb1TwWvw-JtN33I",
  authDomain: "phdevbin.firebaseapp.com",
  databaseURL: "https://phdevbin.firebaseio.com",
  projectId: "phdevbin",
  storageBucket: "phdevbin.appspot.com",
  messagingSenderId: "269534461245",
  appId: "1:269534461245:web:75ff60f80205d6da",
  measurementId: "G-LZR2PVKWM7",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(async function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // we re-send the message from firebase to the listening clients (Wasabee-IITC)
  const allClients = await clients.matchAll({
    includeUncontrolled: true
  });

  if(allClients.length === 0) {
    self.registration.unregister();
  } else {
    for (const client of allClients) {
      console.log("posting firebase to message client: ", client, payload);
      client.postMessage(payload);
    }
  }

  // If we actually want to show a notification, Customize it here
  // var notificationTitle = 'Wasabee Update';
  // var notificationOptions = {
  //   body: payload,
  //   icon: '/static/android-chrome-192x192.png'
  // };

  // If we actually want to show a notification that the user could interact with...
  // return await self.registration.showNotification(notificationTitle,
  //   notificationOptions);
});
