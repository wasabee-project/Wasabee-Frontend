importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js')
 
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

const messaging = firebase.messaging();

messaging.onBackgroundMessage(async function(payload) {
  console.debug('[firebase-messaging-sw.js] Received background message ', payload);

  // we re-send the message from firebase to the listening clients (Wasabee-IITC & WebUI)
  const allClients = await clients.matchAll({
    includeUncontrolled: true
  });

  if(allClients.length === 0) {
    self.registration.unregister();
  } else {
    for (const client of allClients) {
      console.debug("posting firebase to message client: ", client, payload);
      client.postMessage(payload);
    }
  }
});
