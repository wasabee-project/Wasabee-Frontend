import "bootstrap";
import L from "leaflet";
import { firebaseInit, runFirebaseStart, logEvent } from "./firebase";
import {
  loadConfig,
  logoutPromise,
  SetTeamState,
  SetTeamShareWD,
  SetTeamLoadWD,
  deleteTeamPromise,
  leaveTeamPromise,
  newTeamPromise,
  deleteOpPromise,
  opPromise,
} from "./server";
import { startSendLoc, stopSendLoc } from "./loc";
import WasabeeOp from "./operation";
import WasabeeTeam from "./team";
import WasabeeMe from "./me";
import { displaySettings } from "./displaySettings";
import { notify } from "./notify";
import { displayOp } from "./displayOp";
import { displayTeam } from "./displayTeam";
import { displayHelp } from "./displayHelp";
import polyfill from "./polyfill";

import { clearOpsStorage, loadMeAndOps } from "./sync";

import Vue from "vue";
//import VueRouter from 'vue-router'

import OperationsView from "./views/Operations.vue";

async function wasabeeMain() {
  console.log("Start wasabee UI");
  try {
    const raw = await loadConfig();
    window.wasabeewebui = JSON.parse(raw);
    await firebaseInit();
  } catch (e) {
    notify("unable to load config: " + e, "danger", true);
    console.log(e);
    return;
  }
  window.wasabeewebui._updateList = new Map();

  // TODO: off-line mode that just uses the data in localStorage
  // for when you are doing an op and have low/no signal

  try {
    await loadMeAndOps();
    startSendLoc();
    buildMenu();
    chooseScreen(null);
  } catch (e) {
    console.log(e);
    notify(e);
    return;
  }
  runFirebaseStart();

  // for debugging only, we listen to firebase directly and don't need the service worker
  window.addEventListener("message", (event) => {
    notify(JSON.stringify(event), "dark");
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
    console.log("popstate", event);
    if (event.state != null) {
      chooseScreen(event.state);
    }
    return true;
  };
}

function buildMenu() {
  // since we are using leaflet for the maps, might as well take advantage of its dom framework
  const nb = document.getElementById("navbar-collapse");
  const ul = L.DomUtil.create("ul", "navbar-nav mr-auto", nb);

  const menus = new Set();

  const teamsLi = L.DomUtil.create("li", "nav-item", ul);
  const teamsA = L.DomUtil.create("a", "nav-link", teamsLi);
  teamsA.textContent = "Teams";
  teamsA.href = "#teams";
  menus.add(teamsLi);

  const opsLi = L.DomUtil.create("li", "nav-item", ul);
  const opsA = L.DomUtil.create("a", "nav-link", opsLi);
  opsA.textContent = "Operations";
  opsA.href = "#operations";
  menus.add(opsLi);

  const settingsLi = L.DomUtil.create("li", "nav-item", ul);
  const settingsA = L.DomUtil.create("a", "nav-link", settingsLi);
  settingsA.textContent = "Settings";
  settingsA.href = "#settings";
  menus.add(settingsLi);

  const helpLi = L.DomUtil.create("li", "nav-item", ul);
  const helpA = L.DomUtil.create("a", "nav-link", helpLi);
  helpA.textContent = "Help";
  helpA.href = "#help";
  menus.add(helpLi);

  L.DomEvent.on(opsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const m of menus) L.DomUtil.removeClass(m, "active");
    L.DomUtil.addClass(opsLi, "active");
    opsList();
  });
  L.DomEvent.on(teamsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const m of menus) L.DomUtil.removeClass(m, "active");
    L.DomUtil.addClass(teamsLi, "active");
    teamList();
  });
  L.DomEvent.on(settingsA, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const m of menus) L.DomUtil.removeClass(m, "active");
    L.DomUtil.addClass(settingsLi, "active");
    displaySettings();
  });
  L.DomEvent.on(helpA, "click", (ev) => {
    L.DomEvent.stop(ev);
    for (const m of menus) L.DomUtil.removeClass(m, "active");
    L.DomUtil.addClass(helpLi, "active");
    displayHelp();
  });

  const logoutLi = L.DomUtil.create("li", "nav-item", ul);
  const logoutA = L.DomUtil.create("a", "nav-link", logoutLi);
  logoutA.textContent = "Log Out";
  logoutA.href = "#logout";
  L.DomEvent.on(logoutA, "click", async (ev) => {
    L.DomEvent.stop(ev);
    // clear all ops
    clearOpsStorage();
    logEvent("logout");
    history.pushState({ screen: "logout" }, "logout", "#logout");
    try {
      await logoutPromise();
    } catch (e) {
      console.log(e);
      notify(e, "warning", true);
    }
    delete localStorage["me"];
    delete localStorage["sentToServer"];
    window.location.href = "/";
  });
}

function chooseScreen(state) {
  if (!state) state = history.state;

  if (state == null || state.screen == null) {
    // check to see if "deep link"
    state = {};
    const s = window.location.href.substring(
      window.location.href.lastIndexOf("#") + 1
    );
    if (!s) {
      state.screen = "teams";
    } else {
      const y = s.split(".");
      state.screen = y[0];
      if (y[1] && y[2]) {
        state.subscreen = y[1];
        state.team = y[2];
        state.op = y[2];
      }
    }
  }

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
      teamList();
  }
}

function teamList() {
  logEvent("screen_view", { screen_name: "teams" });
  history.pushState({ screen: "teams" }, "teams", "#teams");

  // clear the old screen
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);
  const content = document.getElementById("wasabeeContent");
  while (content.lastChild) content.removeChild(content.lastChild);

  const me = WasabeeMe.cacheGet();

  // use a set instead of a map
  const owned = new Map();
  for (const o of me.Teams) {
    if (o.Owner == me.GoogleID) owned.set(o.ID, true);
  }

  content.innerHTML = `
<div class="container"><div class="row"><div class="col">
<h1>Teams <a href="#teams" id="teamRefresh">↻</a></h1>
<table class="table table-striped">
<thead class="thead">
 <tr>
  <th scope="col">Team</th>
  <th scope="col">Share Location</th>
  <th scope="col">Share WD Keys</th>
  <th scope="col">Load WD Keys</th>
  <th scope="col"></th>
  <th scope="col">Ops</th>
 </tr>
</thead>
<tbody id="teams"></tbody>
</table>
</div></div>
<div class="row"><div class="col">
<label>New Team: <input type="text" id="newTeamName" placeholder="New Team"></label><button id="newTeamButton">New Team</button>
</div></div></div>`;

  const teamRefreshNav = document.getElementById("teamRefresh");
  L.DomEvent.on(teamRefreshNav, "click", async (ev) => {
    L.DomEvent.stop(ev);
    try {
      await loadMeAndOps();
      teamList();
    } catch (e) {
      notify(e, "warning", true);
      console.log(e);
    }
  });

  const newTeamButton = document.getElementById("newTeamButton");
  L.DomEvent.on(newTeamButton, "click", async (ev) => {
    L.DomEvent.stop(ev);
    const newTeamName = document.getElementById("newTeamName");
    if (!newTeamName.value) {
      notify("specify new team name");
      return;
    }
    try {
      await newTeamPromise(newTeamName.value);
      await loadMeAndOps();
      teamList();
    } catch (e) {
      notify(e, "warning", true);
      console.log(e);
    }
  });

  const tbody = document.getElementById("teams");

  if (me.Teams.length == 0) {
    tbody.innerHTML = `
<tr>
<td colspan="6">You are not on any teams, have your operator add you with this GoogleID: ${me.GoogleID}</td>
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
    L.DomEvent.on(stateCheck, "change", async (ev) => {
      L.DomEvent.stop(ev);
      const s = stateCheck.checked ? "On" : "Off";
      try {
        await SetTeamState(t.ID, s);
        if (!stateCheck.checked) {
          logEvent("leave_group");
        } else {
          logEvent("join_group");
        }

        await loadMeAndOps();
        teamList();
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    });

    const sharewd = L.DomUtil.create("td", null, row);
    const sharewdCheck = L.DomUtil.create("input", "form-check-input", sharewd);
    sharewdCheck.type = "checkbox";
    if (t.ShareWD == "On") sharewdCheck.checked = true;
    L.DomEvent.on(sharewdCheck, "change", async (ev) => {
      L.DomEvent.stop(ev);
      const s = sharewdCheck.checked ? "On" : "Off";
      try {
        await SetTeamShareWD(t.ID, s);
        notify("share wd set", "success");
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    });

    const loadwd = L.DomUtil.create("td", null, row);
    const loadwdCheck = L.DomUtil.create("input", "form-check-input", loadwd);
    loadwdCheck.type = "checkbox";
    if (t.LoadWD == "On") loadwdCheck.checked = true;
    L.DomEvent.on(loadwdCheck, "change", async (ev) => {
      L.DomEvent.stop(ev);
      const s = loadwdCheck.checked ? "On" : "Off";
      try {
        await SetTeamLoadWD(t.ID, s);
        notify("load wd set", "success");
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    });

    const own = L.DomUtil.create("td", null, row);
    if (owned.has(t.ID)) {
      const b = L.DomUtil.create("button", "button", own);
      b.textContent = "Delete";
      L.DomEvent.on(b, "click", async (ev) => {
        L.DomEvent.stop(ev);
        try {
          await deleteTeamPromise(t.ID);
          logEvent("leave_group");
          await loadMeAndOps();
          teamList();
        } catch (e) {
          console.log(e);
          notify(e, "warning");
        }
      });
    } else {
      const b = L.DomUtil.create("button", "button", own);
      b.textContent = "Leave";
      L.DomEvent.on(b, "click", async (ev) => {
        L.DomEvent.stop(ev);
        try {
          await leaveTeamPromise(t.ID);
          logEvent("leave_group");
          await loadMeAndOps();
          teamList();
        } catch (e) {
          console.log(e);
          notify(e, "warning");
        }
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

  const vm = new Vue({
    el: '#wasabeeContent',
    render: (h) => h(OperationsView),
  });
}

// polyfill
polyfill();

// entry into main
window.addEventListener('load', wasabeeMain);
