import L from "leaflet";
import { firebaseInit, runFirebaseStart } from "./firebase";
import { loadConfig } from "./server";
import { startSendLoc, stopSendLoc } from "./loc";
import { notify } from "./notify";
import polyfill from "./polyfill";

import { loadMeAndOps } from "./sync";

import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";

import router from "./router";

import AppView from "./App.vue";

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
}

// polyfill
polyfill();

// entry into main
window.addEventListener('load', wasabeeMain);
