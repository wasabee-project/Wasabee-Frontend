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
    <router-view />
    <div id="loading-animation"></div>
  </div>
</template>

<script>
import { notify } from "./notify";
import { clearOpsStorage } from "./sync";
import { logoutPromise } from "./server";

export default {
  methods: {
    logout: async function () {
      // clear all ops
      clearOpsStorage();
      try {
        await logoutPromise();
      } catch (e) {
        console.log(e);
        notify(e, "warning", true);
      }
      delete localStorage["me"];
      delete localStorage["sentToServer"];
      window.location.href = "/";
    },
  },
};
</script>
