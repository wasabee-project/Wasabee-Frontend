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
import { BootstrapVue } from "bootstrap-vue";

import router from "./router";

import AppView from "./App.vue";
import OperationsView from "./views/Operations.vue";
import TeamsView from "./views/Teams.vue";

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
    //chooseScreen(null);
  } catch (e) {
    console.log(e);
    notify(e);
    return;
  }
  runFirebaseStart();

  Vue.use(BootstrapVue);

  const app = new Vue({
    el: "#app",
    router,
    render: (h) => h(AppView),
  });
  app.$mount("#app");

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
      const y = s.split("/");
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

  const vm = new Vue({
    el: "#wasabeeContent",
    render: (h) => h(TeamsView),
  });
}

function opsList() {
  logEvent("screen_view", { screen_name: "ops" });
  history.pushState({ screen: "operations" }, "operations", "#operations");

  // clear the old screen
  const subnav = document.getElementById("wasabeeSubnav");
  while (subnav.lastChild) subnav.removeChild(subnav.lastChild);

  const vm = new Vue({
    el: "#wasabeeContent",
    render: (h) => h(OperationsView),
  });
}

// polyfill
polyfill();

// entry into main
window.addEventListener('load', wasabeeMain);
