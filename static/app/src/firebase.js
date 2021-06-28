import { WasabeeMe } from "./me";
import { sendTokenToWasabee, getCustomTokenFromServer } from "./server";
import firebase from "firebase/app";
import "firebase/messaging";
import "firebase/analytics";
import "firebase/auth";
import { notify } from "./notify";

import eventHub from "./eventHub";

let messaging = null;

export async function firebaseInit() {
  try {
    firebase.initializeApp(window.wasabeewebui.firebaseConfig);
    firebase.analytics();
    messaging = firebase.messaging();
    messaging.usePublicVapidKey(window.wasabeewebui.publicVapidKey);
    window.wasabeewebui.fbinited = true;
    window.wasabeewebui.observedLogins = new Map();
  } catch (e) {
    notify(
      "Unable to start Firebase messaging, real-time notifications will not work",
      "warning"
    );
    window.wasabeewebui.fbinited = false;
    console.log(e);
    return;
  }

  const auth = firebase.auth();
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Firebase auth login: ", user.uid);
      return;
    }
    console.log("Firebase auth logout");
    delete localStorage["customToken"];
  });

  if (localStorage["customToken"] == null) {
    try {
      localStorage["customToken"] = await getCustomTokenFromServer();
      auth.signInWithCustomToken(localStorage["customToken"]);
    } catch (e) {
      console.log(e.message);
      delete localStorage["customToken"];
    }
  }

  messaging.onTokenRefresh(() => {
    messaging
      .getToken()
      .then((refreshedToken) => {
        console.log("Firebase messaging token refreshed.");
        setTokenSentToServer(false);
        sendTokenToServer(refreshedToken);
      })
      .catch((err) => {
        console.log(
          "Unable to retrieve refreshed Firebase messaging token ",
          err
        );
      });
  });
}

export function runFirebaseStart() {
  if (!messaging) return;

  const me = WasabeeMe.cacheGet();
  messaging.onMessage((payload) => {
    if (payload.data && payload.data.cmd) {
      logEvent("message_received", { command: payload.data.cmd });
      switch (payload.data.cmd) {
        case "Agent Location Change":
        case "Generic Message":
          console.log("FB message:", payload.data);
          break;
        case "Marker Status Change":
        case "Link Status Change":
        case "Marker Assignment Change":
        case "Link Assignment Change":
          eventHub.$emit("notifyChange", payload.data);
          console.log("FB message:", payload.data);
          break;
        case "Map Change":
          console.log("FB message:", payload.data);
          eventHub.$emit("mapChanged", payload.data);
          break;
        case "Login":
          if (me.GoogleID != payload.data.gid) {
            if (window.wasabeewebui.observedLogins.has(payload.data.gid)) {
              const lastSeen = window.wasabeewebui.observedLogins.get(
                payload.data.gid
              );
              if (Date.now() - lastSeen > 36000) {
                window.wasabeewebui.observedLogins.set(
                  payload.data.gid,
                  Date.now()
                );
                notify(`Teammate Login: ${payload.data.gid}`, "primary", false);
              } // else too recent, just ignore
            } else {
              window.wasabeewebui.observedLogins.set(
                payload.data.gid,
                Date.now()
              );
              notify(`Teammate Login: ${payload.data.gid}`, "primary", false);
            }
          }
          break;
        case "Delete":
          console.log("FB message:", payload.data);
          break;
        case "Subscribe":
          console.log("FB message:", payload.data);
          break;
        case "Target":
          console.log("FB message:", payload.data);
          break;
        case "Quit":
          console.log("FB message:", payload.data);
          break;
        default:
          console.log("FB unknown:", payload);
      }
    }
  });

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
      console.log("An error occurred while retrieving messaging token. ", err);
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
          "Unable to send Firebase messaging token to the server. (User not logged in?)",
          error
        );
      });
  } else {
    console.log(
      "Firebase messaging token already sent to server so won't send it again unless it changes"
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
  if (!window.wasabeewebui.fbinited) return;

  // GDPR requirement
  if (localStorage["analytics"] != "true") return;

  params.app_version = "0.0.2";
  params.app_name = "Wasabee-WebUI";
  firebase.analytics().logEvent(e, params);
}
