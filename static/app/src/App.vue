<template>
  <div id="app">
    <b-navbar toggleable="lg" type="dark" variant="dark">
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item to="/teams">Teams</b-nav-item>
          <b-nav-item to="/operations">Operations</b-nav-item>
          <b-nav-item to="/defensivekeys">Defensive keys</b-nav-item>
          <b-nav-item to="/settings">Settings</b-nav-item>
          <b-nav-item to="/help">Help</b-nav-item>
          <b-nav-item v-on:click="logout">Log out</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
    <div id="wasabeeNotification">
      <b-alert
        v-for="(alert, i) in alerts"
        :key="i"
        :variant="alert.level"
        :show="alert.show"
        @dismissed="alert.show = false"
        dismissible
        fade
      >
        {{ alert.message }}
      </b-alert>
    </div>
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

import eventHub from "./eventHub";

import WasabeeMe from "./me";
import WasabeeOp from "./operation";

export default {
  data: () => ({
    me: WasabeeMe.cacheGet(),
    loading: false,
    alerts: [],
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
    makeToast: function (options) {
      options.show = true;
      this.alerts.push(options);
      setTimeout(() => {
        options.show = false;
      }, 5000);
    },
    notifyChange: function (data) {
      try {
        const op = WasabeeOp.load(data.opID);
        if (!op) return;
        if (op.lasteditid == data.updateID) return;
        if (data.cmd == "Marker Assignment Change") {
          const marker = op.getMarker(data.markerID);
          const portal = op.getPortal(marker.portalId);
          this.makeToast({
            message: `You are assigned to ${marker.friendlyType} on ${portal.name} in operation ${op.name}`,
            level: "info",
          });
        } else if (data.cmd == "Link Assignment Change") {
          const link = op.getLinkByID(data.linkID);
          const from = op.getPortal(link.fromPortalId);
          const to = op.getPortal(link.toPortalId);
          this.makeToast({
            message: `You are assigned to the link from ${from.name} to ${to.name} in operation ${op.name}`,
            level: "info",
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
  },
  created() {
    eventHub.$on("notify", this.makeToast);
    eventHub.$on("notifyChange", this.notifyChange);
  },
};
</script>
