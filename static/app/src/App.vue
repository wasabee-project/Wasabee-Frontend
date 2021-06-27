<template>
  <div id="app">
    <b-navbar toggleable="lg">
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/teams">Teams</b-nav-item>
          <b-nav-item to="/operations">Operations</b-nav-item>
          <b-nav-item to="/settings">Settings</b-nav-item>
          <b-nav-item to="/help">Help</b-nav-item>
          <b-nav-item v-on:click="logout">Log out</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <div id="wasabeeAlerts"></div>
    <router-view
      v-on:refresh="refresh"
      :me="me"
      :class="{ loading: loading }"
    />
    <div id="loading-animation"></div>
  </div>
</template>

<script>
import { notify } from "./notify";
import { loadMeAndOps, clearOpsStorage } from "./sync";
import { logoutPromise } from "./server";

import WasabeeMe from "./me";

export default {
  data: () => ({
    me: WasabeeMe.cacheGet(),
    loading: false,
  }),
  methods: {
    refresh: async function () {
      this.loading = true;
      try {
        await loadMeAndOps();
        this.me = WasabeeMe.cacheGet();
      } catch (e) {
        console.log(e);
        if (e.message == "invalid data from /me") this.logout();
        notify(e, "warning", true);
      }
      this.loading = false;
    },
    logout: async function () {
      // clear all ops
      clearOpsStorage();
      try {
        await logoutPromise();
      } catch (e) {
        console.log(e);
        notify(e, "warning", true);
      }
      WasabeeMe.purge();
      delete localStorage["sentToServer"];
      window.location.href = "/";
    },
  },
};
</script>
