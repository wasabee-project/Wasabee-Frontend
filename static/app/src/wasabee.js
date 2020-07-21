import "bootstrap";
import L from "leaflet";
import { firebaseInit, runFirebaseStart, logEvent } from "./firebase";
import {
  loadConfig,
  loadMe,
  loadLogout,
  syncOps,
  setTeamState,
  leaveTeam,
  startSendLoc,
  stopSendLoc,
} from "./server";
import WasabeeOp from "./operation";
import WasabeeMe from "./me";
import { displaySettings } from "./displaySettings";
import { notify } from "./notify";
import { displayOp } from "./displayOp";
import { displayTeam } from "./displayTeam";
import polyfill from "./polyfill";

export function wasabeeMain() {
  // opIdLength: 40,
  // auto-detect server based on URL
  // look in localStorage and update server config if the user has selected a different server
  window.wasabeewebui = {};

  loadConfig().then(
    (config) => {
      window.wasabeewebui = config;
      firebaseInit();
      loadMe().then(
        (resolve) => {
          // run init logic here
          runFirebaseStart();

          const me = new WasabeeMe(resolve);
          if (me.GoogleID) {
            me.store();
            startSendLoc();
            syncOps(me.Ops).then(() => {
              buildMenu();
              chooseScreen(null);
            });
          } else {
            console.log(me);
            notify("refresh required");
          }
        },
        (reject) => {
          // redirect to /login and try again
          console.log(reject);
          notify(reject);
          // window.location.href = "/login";
        }
      );
    },
    (reject) => {
      notify("unable to load config: " + reject);
      console.log(reject);
    }
  );

  // for debugging only, we listen to firebase directly and don't need the service worker
  window.addEventListener("message", (event) => {
    notify(JSON.stringify(event), "primary");
    console.log("Service Worker message received: ", event);
  });

  // if the user switches to another tab and back, update location
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        stopSendLoc();
      } else {
        startSendLoc();
      }
    },
    false
  );

  // for some reason too many history events get registered, breaking back-button functionality
  window.onpopstate = (event) => {
    if (event.state != null) {
      console.log("popstate", event);
      chooseScreen(event.state);
      // use the leaflet event stoppers
      event.preventDefault();
      return true;
    }
  };

  // TODO: off-line mode that just uses the data in localStorage
  // for when you are doing an op and have low/no signal

  // get /me, if not possible, request login
}

function buildMenu() {
  // since we are using leaflet for the maps, might as well take advantage of its dom framework
  const nb = document.getElementById("navbar-collapse");
  const ul = L.DomUtil.create("ul", "navbar-nav mr-auto", nb);

  const teamsLi = L.DomUtil.create("li", "nav-item", ul);
  const teamsA = L.DomUtil.create("a", "nav-link", teamsLi);
  teamsA.textContent = "Teams";
  teamsA.href = "#teams";

  const opsLi = L.DomUtil.create("li", "nav-item", ul);
  const opsA = L.DomUtil.create("a", "nav-link", opsLi);
  opsA.textContent = "Operations";
  opsA.href = "#operations";

  const settingsLi = L.DomUtil.create("li", "nav-item", ul);
  const settingsA = L.DomUtil.create("a", "nav-link", settingsLi);
  settingsA.textContent = "Settings";
  settingsA.href = "#settings";

  L.DomEvent.on(opsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    L.DomUtil.removeClass(teamsLi, "active");
    L.DomUtil.addClass(opsLi, "active");
    L.DomUtil.removeClass(settingsLi, "active");
    opsList();
  });
  L.DomEvent.on(teamsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    L.DomUtil.addClass(teamsLi, "active");
    L.DomUtil.removeClass(opsLi, "active");
    L.DomUtil.removeClass(settingsLi, "active");
    teamList();
  });
  L.DomEvent.on(settingsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    L.DomUtil.removeClass(teamsLi, "active");
    L.DomUtil.removeClass(opsLi, "active");
    L.DomUtil.addClass(settingsLi, "active");
    displaySettings();
  });

  const logoutLi = L.DomUtil.create("li", "nav-item", ul);
  const logoutA = L.DomUtil.create("a", "nav-link", logoutLi);
  logoutA.textContent = "Log Out";
  logoutA.href = "#logout";
  L.DomEvent.on(logoutA, "click", (ev) => {
    L.DomEvent.stop(ev);
    // clear all ops
    clearOpsStorage();
    logEvent("logout");
    history.pushState({ screen: "logout" }, "logout", "#logout");
    loadLogout().then(
      () => {
        delete localStorage["me"];
        delete localStorage["loadedOp"];
        window.location.href = "/";
      },
      (reject) => {
        console.log(reject);
        delete localStorage["me"];
        delete localStorage["loadedOp"];
        window.location.href = "/";
      }
    );
  });
}

// TODO: look at the current URL # and parse to determine where we ought to go
function chooseScreen(state) {
  if (!state) state = history.state;

  if (state == null || state.screen == null) {
    history.replaceState({ screen: "teams" }, "teams", "/me");
    teamList();
    return;
  }

  console.log(state);
  switch (state.screen) {
    case "operation":
      displayOp(state);
      break;
    case "operations":
      opsList();
      break;
    case "settings":
      displaySettings();
      break;
    case "team":
      displayTeam(state);
      break;
    case "teams":
      teamList();
      break;
    default:
      console.log("unknown state for chooseScreen", state);
      teamList();
  }
}

function loadMeAndOps() {
  clearOpsStorage();
  return new Promise(function (resolve, reject) {
    loadMe(true)
      .then((json) => {
        const nme = new WasabeeMe(json);
        if (nme.GoogleID) {
          nme.store();
          syncOps(nme.Ops).then(resolve);
        } else {
          console.log(json);
          reject("bad data?");
        }
      })
      .catch((error) => {
        notify(error);
        console.log(error);
        reject(error);
      });
  });
}

function teamList() {
  logEvent("screen_view", { screen_name: "teams" });
  history.pushState({ screen: "teams" }, "teams", "#teams");

  // clear the old screen
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);
  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  const me = WasabeeMe.get();

  const owned = new Map();
  for (const o of me.OwnedTeams) owned.set(o.ID, true);

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1>Teams <a id="teamRefresh">🗘</a></h1>
<table class="table table-striped">
<thead class="thead"><tr><th scope="col">Team</th><th scope="col">State</th><th scope="col"></th><th scope="col">Ops</th></tr></thead>
<tbody id="teams"></tbody>
</table>
</div></div></div>`;

  const teamRefreshNav = document.getElementById("teamRefresh");
  L.DomEvent.on(teamRefreshNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    loadMeAndOps().then(() => teamList());
  });

  const tbody = document.getElementById("teams");

  if (me.Teams.length == 0) {
    tbody.innerHTML = `
<tr>
<td colspan="4">You are not on any teams, have your operator add you with this GoogleID: ${me.GoogleID}</td>
</tr>
`;
  }

  for (const t of me.Teams) {
    const row = L.DomUtil.create("tr", null, tbody);
    const name = L.DomUtil.create("td", null, row);
    const nameA = L.DomUtil.create("a", null, name);
    nameA.href = `#team.list.${t.ID}`;
    nameA.textContent = t.Name;
    L.DomEvent.on(nameA, "click", (ev) => {
      L.DomEvent.stop(ev);
      displayTeam({ screen: "team", team: t.ID, subscreen: "list" });
    });

    const state = L.DomUtil.create("td", null, row);
    const stateCheck = L.DomUtil.create("input", "form-check-input", state);
    stateCheck.type = "checkbox";
    if (t.State == "On") stateCheck.checked = true;
    L.DomEvent.on(stateCheck, "change", (ev) => {
      L.DomEvent.stop(ev);
      const s = stateCheck.checked ? "On" : "Off";
      // this is not the way to do promise chaining, but I couldn't get it to work so this is good enough for now
      setTeamState(t.ID, s).then(() => {
        if (!stateCheck.checked) {
          clearOpsStorage();
          logEvent("leave_group");
        } else {
          logEvent("join_group");
        }

        loadMeAndOps().then(() => teamList());
      });
    });

    const own = L.DomUtil.create("td", null, row);
    if (owned.has(t.ID)) {
      own.textContent = "owner";
    } else {
      const b = L.DomUtil.create("button", "button", own);
      b.textContent = "Leave";
      L.DomEvent.on(b, "click", (ev) => {
        L.DomEvent.stop(ev);
        // XXX use real promise chainng
        leaveTeam(t.ID).then(() => {
          //clearOpsStorage();
          logEvent("leave_group");
          loadMeAndOps().then(() => teamList());
        });
      });
    }

    const ops = L.DomUtil.create("td", null, row);
    const lsk = Object.keys(localStorage);
    for (const id of lsk) {
      if (id.length != 40) continue;
      const op = new WasabeeOp(localStorage[id]);
      if (!op || !op.ID) continue;
      for (const opteam of op.teamlist) {
        if (t.ID == opteam.teamid) {
          const a = L.DomUtil.create("a", "opname", ops);
          a.href = `#operation.checklist.${op.ID}`;
          a.textContent = op.name;
          L.DomEvent.on(a, "click", (ev) => {
            L.DomEvent.stop(ev);
            displayOp({ screen: "operation", op: op.ID, state: "checklist" });
          });
          L.DomUtil.create("br", null, ops);
        }
      }
    }
  }
}

function opsList() {
  logEvent("screen_view", { screen_name: "ops" });
  history.pushState({ screen: "operations" }, "operations", "#operations");

  // clear the old screen
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);
  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  const me = WasabeeMe.get();

  const teamMap = new Map();
  for (const t of me.Teams) {
    teamMap.set(t.ID, t.Name);
  }

  // bootstrap layout
  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1>Operations <a id="opsRefresh">🗘</a></h1>
<table class="table table-striped">
<thead class="thead"><tr><th scope="col">Operation</th><th scope="col">Comment</th><th scope="col">Teams</th></tr></thead>
<tbody id="ops"></tbody>
</table>
</div></div></div>`;

  const teamRefreshNav = document.getElementById("opsRefresh");
  L.DomEvent.on(teamRefreshNav, "click", (ev) => {
    L.DomEvent.stop(ev);
    loadMeAndOps().then(() => opsList());
  });

  const tbody = document.getElementById("ops");

  const lsk = Object.keys(localStorage);
  for (const id of lsk) {
    if (id.length != 40) continue;
    const op = new WasabeeOp(localStorage[id]);
    if (!op || !op.ID) continue;

    const row = L.DomUtil.create("tr", null, tbody);
    const name = L.DomUtil.create("td", null, row);
    const nameA = L.DomUtil.create("a", null, name);
    nameA.href = `#operation.checklist.${op.ID}`;
    nameA.textContent = op.name;
    L.DomEvent.on(nameA, "click", (ev) => {
      L.DomEvent.stop(ev);
      displayOp({ screen: "operation", op: op.ID, state: "main" });
    });

    const comment = L.DomUtil.create("td", null, row);
    comment.textContent = op.comment;

    const teams = L.DomUtil.create("td", null, row);
    for (const t of op.teamlist) {
      if (teamMap.has(t.teamid)) {
        const a = L.DomUtil.create("a", null, teams);
        a.textContent = teamMap.get(t.teamid);
        a.href = `#team.list.${t.teamid}`;
        L.DomEvent.on(a, "click", (ev) => {
          L.DomEvent.stop(ev);
          displayTeam({ screen: "team", team: t.teamid, subscreen: "list" });
        });
      } else {
        const span = L.DomUtil.create("span", null, teams);
        span.textContent = `Unknown Team: ${t.teamid}`;
      }
      L.DomUtil.create("br", null, teams);
    }
  }
}

function clearOpsStorage() {
  const lsk = Object.keys(localStorage);
  for (const id of lsk) {
    if (id.length == 40) delete localStorage[id];
  }
}

// polyfill
polyfill();

// entry into main
wasabeeMain();
