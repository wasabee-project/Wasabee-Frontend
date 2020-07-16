import WasabeeOp from "./operation";
import WasabeeMe from "./me";
import { notify } from "./notify";

export function sendTokenToWasabee(token) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me/firebase`;
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.withCredentials = true;

    req.onload = function () {
      if (req.status === 200) {
        console.log("token sent OK");
        resolve();
      } else {
        reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send(token);
  });
}

export function loadMe(force = false) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me?json=y`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    if (!force) {
      const lsme = localStorage["me"];
      if (lsme) {
        const maxCacheAge = Date.now() - 1000 * 60 * 59;
        const l = new WasabeeMe(lsme);
        if (l.fetched && l.fetched > maxCacheAge) {
          resolve(lsme);
        }
      }
    }

    req.onload = function () {
      if (req.status === 200) {
        try {
          resolve(req.response);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function loadLogout() {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me/logout`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      if (req.status === 200) {
        try {
          resolve(req.response);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function loadOp(opID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/draw/${opID}`;
    const req = new XMLHttpRequest();
    const localop = new WasabeeOp(localStorage[opID]);

    req.open("GET", url);
    req.withCredentials = true;
    if (localop != null && localop.fetched) {
      req.setRequestHeader("If-Modified-Since", localop.fetched);
    }

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        case 304: // If-Modified-Since replied NotModified
          // console.debug("server copy is older/unmodified, keeping local copy");
          resolve(localStorage[opID]);
          break;
        case 401:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function syncOps(ops) {
  // will never reject
  return new Promise(function (resolve) {
    const promises = new Array();
    for (const o of ops) promises.push(loadOp(o.ID));
    Promise.allSettled(promises).then((results) => {
      for (const r of results) {
        if (r.status == "fulfilled") {
          const newop = new WasabeeOp(r.value);
          newop.store();
        } else {
          console.log(r);
          notify("Op load failed");
        }
      }
      resolve(true);
    });
  });
}

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
      (position) => {
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
        _sendLoc(position.coords.latitude, position.coords.longitude).then(
          () => {
            // console.log("location sent");
          },
          (reject) => {
            notify("Unable to send location to server", "danger");
            console.log(reject);
            stopSendLoc();
          }
        );
      },
      (error) => {
        notify("Unable to determine location", "danger");
        console.log(error);
        if (window.wasabeewebui.sendLocInterval) {
          stopSendLoc();
        }
      }
    );
  }
}

function _sendLoc(lat, lon) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me?lat=${lat}&lon=${lon}`;
    const req = new XMLHttpRequest();

    req.open("GET", url);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function loadTeam(teamID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function removeAgentFromTeam(teamID, googleID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/${googleID}`;
    const req = new XMLHttpRequest();
    req.open("DELETE", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    req.send();
  });
}

export function setSquad(teamID, googleID, squad) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/${googleID}/squad`;
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };
    const fd = new FormData();
    fd.append("squad", squad);
    req.send(fd);
  });
}

export function setDisplayName(teamID, googleID, displayname) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/${googleID}/displayname`;
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    const fd = new FormData();
    fd.append("displayname", displayname);
    req.send(fd);
  });
}

export function setTeamState(teamID, state) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me/${teamID}?state=${state}`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    req.send();
  });
}

export function leaveTeam(teamID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/me/${teamID}`;
    const req = new XMLHttpRequest();
    req.open("DELETE", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    req.send();
  });
}

export function changeTeamOwnerPromise(teamID, newOwner) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/chown?to=${newOwner}`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    req.send();
  });
}

export function createJoinLinkPromise(teamID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/genJoinKey`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    req.send();
  });
}

export function deleteJoinLinkPromise(teamID) {
  return new Promise(function (resolve, reject) {
    const url = `${window.wasabeewebui.server}/api/v1/team/${teamID}/delJoinKey`;
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.withCredentials = true;

    req.onload = function () {
      switch (req.status) {
        case 200:
          resolve(req.response);
          break;
        default:
          reject(Error(`${req.status}: ${req.statusText} ${req.responseText}`));
          break;
      }
    };
    req.onerror = function () {
      reject(Error(`Network Error: ${req.responseText}`));
    };

    req.send();
  });
}
