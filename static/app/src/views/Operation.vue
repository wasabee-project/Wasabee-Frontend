<template>
  <div id="wasabeeContent">
    <b-nav tabs>
      <b-nav-item to="list">Checklist</b-nav-item>
      <b-nav-item to="assignments">Assignments</b-nav-item>
      <b-nav-item to="map">Map</b-nav-item>
      <b-nav-item to="keys">Keys</b-nav-item>
      <b-nav-item to="manage" v-if="canWrite">Manage</b-nav-item>
      <b-nav-item to="permissions" v-if="canWrite">Permissions</b-nav-item>
      <b-button v-on:click="refresh()" variant="primary">↻</b-button>
    </b-nav>
    <router-view
      v-on:refresh="refresh"
      v-if="operation"
      :operation="operation"
      :canWrite="canWrite"
    />
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeTeam from "../team";

import { opPromise } from "../server";

import eventHub from "../eventHub";

export default {
  props: ["id"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
    operation: null,
  }),
  computed: {
    canWrite: function () {
      if (!this.operation) return false;
      if (this.me.GoogleID == this.operation.creator) return true;
      for (const t of this.operation.teamlist)
        if (t.role == "write") return true;
      return false;
    },
  },
  methods: {
    refresh: async function (data) {
      if (data && data.opID !== this.id) return;
      const op = await opPromise(this.id);
      op.store();
      this.operation = op;
    },
  },
  async created() {
    const op = await opPromise(this.id);
    op.store();
    this.operation = op;

    eventHub.$on("mapChanged", this.refresh);
  },
  beforeDestroy() {
    eventHub.$off("mapChanged", this.refresh);
  },
};
</script>
