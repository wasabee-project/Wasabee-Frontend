import { WasabeeMe } from "./me";
import { sendTokenToWasabee } from "./server";
import * as firebase from "firebase/app";
import "firebase/messaging";
import "firebase/analytics";
import "firebase/auth";
import { notify } from "./notify";

let messaging = null;
let inited = false;
const observedLogins = new Map();

export function firebaseInit() {
  try {
    firebase.initializeApp(window.wasabeewebui.firebaseConfig);
    firebase.analytics();
    messaging = firebase.messaging();
    messaging.usePublicVapidKey(window.wasabeewebui.publicVapidKey);
    inited = true;
  } catch (e) {
    notify(
      "Unable to start firebase, real-time notifications will not work",
      "warning"
    );
    console.log(e);
    return;
  }

  messaging.onTokenRefresh(() => {
    messaging
      .getToken()
      .then((refreshedToken) => {
        console.log("Token refreshed.");
        setTokenSentToServer(false);
        sendTokenToServer(refreshedToken);
      })
      .catch((err) => {
        console.log("Unable to retrieve refreshed token ", err);
      });
  });

  const me = WasabeeMe.get();

  messaging.onMessage((payload) => {
    if (payload.data && payload.data.cmd) {
      logEvent("message_received", { command: payload.data.cmd });
      switch (payload.data.cmd) {
        // {"Quit", "Generic Message", "Agent Location Change", "Map Change", "Marker Status Change", "Marker Assignment Change", "Link Status Change",
        //  "Link Assignment Change", "Subscribe"}
        case "Agent Location Change":
          console.log(payload);
          // if on the matching team's map, update. otherwise ignore
          break;
        case "Generic Message":
          notify(JSON.stringify(payload), "primary", false);
          break;
        case "Map Change":
          console.log("firebase map change: ", payload);
          // download op
          break;
        case "Login":
          if (me.GoogleID != payload.data.gid) {
            if (observedLogins.has(payload.data.gid)) {
              const lastSeen = observedLogins.get(payload.data.gid);
              if (Date.now() - lastSeen > 36000) {
                observedLogins.set(payload.data.gid, Date.now());
                notify(`Teammate Login: ${payload.data.gid}`, "primary", false);
              } // else too recent, just ignore
            } else {
              observedLogins.set(payload.data.gid, Date.now());
              notify(`Teammate Login: ${payload.data.gid}`, "primary", false);
            }
          }
          break;
        default:
          notify(JSON.stringify(payload), "primary", false);
          console.log("Firebase message received: ", payload);
      }
    }
  });
}

export function runFirebaseStart() {
  if (!messaging) return;
  messaging
    .getToken()
    .then((currentToken) => {
      if (currentToken) {
        sendTokenToServer(currentToken);
      } else {
        console.log(
          "No Instance ID token available. Requesting permission to generate one."
        );
        setTokenSentToServer(false);
        requestPermission();
      }
    })
    .catch((err) => {
      console.log("An error occurred while retrieving token. ", err);
      setTokenSentToServer(false);
    });
}

function sendTokenToServer(currentToken) {
  if (!isTokenSentToServer()) {
    console.log("Sending token to server...");
    sendTokenToWasabee(currentToken)
      .then(() => {
        setTokenSentToServer(true);
      })
      .catch((error) => {
        console.warn(
          "Unable to send Firebase token to the server. (User not logged in?)",
          error
        );
      });
  } else {
    console.log(
      "Firebase Token already sent to server so won't send it again unless it changes"
    );
  }
}

function isTokenSentToServer() {
  return window.localStorage.getItem("sentToServer") === "1";
}

function setTokenSentToServer(sent) {
  window.localStorage.setItem("sentToServer", sent ? "1" : "0");
}

function requestPermission() {
  console.log("Requesting permission...");
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
      runFirebaseStart(); // yes, recurse
    } else {
      console.log("Unable to get permission to notify.");
    }
  });
}

export function logEvent(e, params = {}) {
  if (!inited) return;

  // GDPR requirement
  if (localStorage["analytics"] != "true") return;

  params.app_version = "0.0.2";
  params.app_name = "Wasabee-WebUI";
  firebase.analytics().logEvent(e, params);
}
