<template>
  <div id="wasabeeContent" :class="{ loading: loading }">
    <b-nav tabs>
      <b-nav-item to="list">List</b-nav-item>
      <b-nav-item to="map">Key Map</b-nav-item>
      <b-button v-on:click="refresh" variant="primary">↻</b-button>
    </b-nav>
    <router-view v-on:refresh="refresh" v-if="dkeys" :me="me" :dkeys="dkeys" />
  </div>
</template>

<script>
import WasabeeMe from "../me";
import { dKeylistPromise } from "../server";

import { notify } from "../notify";

export default {
  props: ["me"],
  data: () => ({
    dkeys: [],
    loading: true,
  }),
  methods: {
    refresh: function () {
      this.loading = true;
      dKeylistPromise()
        .then((j) => {
          this.dkeys = JSON.parse(j).DefensiveKeys;
          this.loading = false;
        })
        .catch((e) => {
          notify(e.toString());
          this.loading = false;
        });
    },
  },
  created() {
    this.refresh();
  },
};
</script>
