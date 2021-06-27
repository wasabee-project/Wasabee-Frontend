<template>
  <div id="wasabeeContent" :class="{ loading: loading }">
    <b-nav tabs>
      <b-nav-item to="list">List</b-nav-item>
      <b-nav-item to="map">Agent Map</b-nav-item>
      <b-nav-item to="manage" v-if="isOwner">Manage</b-nav-item>
      <b-nav-item to="settings" v-if="isOwner">Settings</b-nav-item>
      <b-button v-on:click="refresh">↻</b-button>
    </b-nav>
    <router-view v-on:refresh="refresh" v-if="team" :team="team" />
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeTeam from "../team";

import { notify } from "../notify";

export default {
  props: ["id", "me"],
  data: () => ({
    team: null,
    loading: true,
  }),
  computed: {
    isOwner: function () {
      for (const team of this.me.Teams) {
        if (team.ID == this.id) return team.Owner == this.me.GoogleID;
      }
      return false;
    },
  },
  methods: {
    refresh: function () {
      this.loading = true;
      WasabeeTeam.waitGet(this.id)
        .then((team) => {
          this.team = team;
          this.loading = false;
        })
        .catch((e) => {
          notify(e.toString());
          this.$router.replace("/teams");
        });
    },
  },
  created() {
    this.refresh();
  },
};
</script>
