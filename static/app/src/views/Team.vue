<template>
  <div id="wasabeeContent">
    <b-nav tabs>
      <b-nav-item to="list">List</b-nav-item>
      <b-nav-item to="map">Agent Map</b-nav-item>
      <b-nav-item to="manage" v-if="isOwner">Manage</b-nav-item>
      <b-nav-item to="settings" v-if="isOwner">Settings</b-nav-item>
    </b-nav>
    <router-view v-on:refresh="refresh" v-if="team" :team="team" />
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeTeam from "../team";

export default {
  props: ["id"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
    team: null,
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
    refresh: async function () {
      this.team = await WasabeeTeam.waitGet(this.id);
    },
  },
  async created() {
    this.team = await WasabeeTeam.waitGet(this.id);
  },
};
</script>
