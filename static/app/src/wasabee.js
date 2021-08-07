import { firebaseInit, runFirebaseStart } from "./firebase";
import { loadConfig } from "./server";
import { startSendLoc, stopSendLoc } from "./loc";
import { notify } from "./notify";
import polyfill from "./polyfill";

import { loadMeAndOps } from "./sync";

import Vue from "vue";
import {
  BAlert,
  BNav,
  BNavbar,
  BNavbarToggle,
  BNavItem,
  BNavbarNav,
  BCollapse,
  BButton,
} from "bootstrap-vue";

import router from "./router";

import AppView from "./App.vue";

async function wasabeeMain() {
  console.log("Start wasabee UI");
  try {
    const raw = await loadConfig();
    window.wasabeewebui = JSON.parse(raw);
    Vue.prototype.$CDN_URL = window.wasabeewebui.cdnurl;
    await loadMeAndOps();
    startSendLoc();
  } catch (e) {
    console.log(e);
    notify("unable to load config: " + e, "danger", true);
    return;
  }
  window.wasabeewebui._updateList = new Map();

  // TODO: off-line mode that just uses the data in localStorage
  // for when you are doing an op and have low/no signal

  //Vue.use(BootstrapVue);
  Vue.component("BAlert", BAlert);
  Vue.component("BNav", BNav);
  Vue.component("BNavbar", BNavbar);
  Vue.component("BNavbarToggle", BNavbarToggle);
  Vue.component("BNavItem", BNavItem);
  Vue.component("BNavbarNav", BNavbarNav);
  Vue.component("BCollapse", BCollapse);
  Vue.component("BButton", BButton);

  const app = new Vue({
    el: "#app",
    router,
    render: (h) => h(AppView),
  });
  app.$mount("#app");

  // do not wait for firebase
  firebaseInit().then(
    () => {
      runFirebaseStart();
    },
    (e) => {
      notify("unable to start firebase: " + e, "danger", true);
    }
  );

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
}

// polyfill
polyfill();

// entry into main
window.addEventListener("load", wasabeeMain);
