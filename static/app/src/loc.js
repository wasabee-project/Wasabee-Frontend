import { locationPromise } from "./server";

export function startSendLoc() {
  if (localStorage["sendLocation"] != "true") return;
  _sendLocation();

  window.wasabeewebui.sendLocInterval = setInterval(() => {
    _sendLocation();
  }, 60000);
}

export function stopSendLoc() {
  clearInterval(window.wasabeewebui.sendLocInterval);
  delete window.wasabeewebui.sendLocInterval;
}

function _sendLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // skip if no change
        if (
          window.wasabeewebui.lastPosition &&
          window.wasabeewebui.lastPosition.latitude ==
            position.coords.latitude &&
          window.wasabeewebui.lastPosition.longitude ==
            position.coords.longitude
        ) {
          console.log("location unchanged, skipping send");
          return;
        }
        window.wasabeewebui.lastPostion = position;
        try {
          await locationPromise(
            position.coords.latitude,
            position.coords.longitude
          );
        } catch (e) {
          console.log(e);
          notify("Unable to send location to server", "warning", true);
          stopSendLoc();
        }
      },
      (error) => {
        notify("Unable to determine location", "secondary", false);
        console.log(error);
        if (window.wasabeewebui.sendLocInterval) {
          stopSendLoc();
        }
      }
    );
  }
}
