<template>
  <div id="wasabeeContent" :class="{ loading: loading }">
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
import { notify } from "../notify";

import eventHub from "../eventHub";

export default {
  props: ["id", "me"],
  data: () => ({
    operation: null,
    loading: true,
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
    refresh: function (data) {
      if (data && data.opID !== this.id) return;
      this.loading = true;
      opPromise(this.id)
        .then((op) => {
          op.store();
          this.operation = op;
          this.loading = false;
        })
        .catch((e) => {
          notify(e.toString());
          this.loading = false;
          this.operation = null;
          this.$router.replace("/operations");
        });
    },
  },
  created() {
    this.refresh();
    eventHub.$on("mapChanged", this.refresh);
  },
  beforeDestroy() {
    eventHub.$off("mapChanged", this.refresh);
  },
};
</script>
