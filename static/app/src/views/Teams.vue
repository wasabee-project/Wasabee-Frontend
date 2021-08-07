<template>
  <div id="wasabeeContent">
    <div class="container">
      <div class="row">
        <h1>
          Teams <b-button v-on:click="refresh" variant="primary">↻</b-button>
        </h1>
        <table class="table table-striped">
          <thead class="thead">
            <tr>
              <th>Team</th>
              <th>Share Location</th>
              <th>Share WD Keys</th>
              <th>Load WD Keys</th>
              <th>Ops</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="teams">
            <tr v-if="!teams.length">
              <td colspan="6">
                You are not on any teams, have your operator add you with this
                GoogleID: {{ me.GoogleID }}
              </td>
            </tr>
            <tr v-for="team in teams" :key="team.ID">
              <td>
                <router-link :to="'/team/' + team.ID + '/list'">
                  {{ team.Name }}
                </router-link>
              </td>
              <td>
                <input
                  type="checkbox"
                  v-model="team.State"
                  true-value="On"
                  false-value="Off"
                  v-on:change="setTeamState(team)"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  v-model="team.ShareWD"
                  true-value="On"
                  false-value="Off"
                  v-on:change="setTeamShareWD(team)"
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  v-model="team.LoadWD"
                  true-value="On"
                  false-value="Off"
                  v-on:change="setTeamLoadWD(team)"
                />
              </td>
              <td>
                <template v-for="(name, id, index) in teamsOps[team.ID]">
                  <template v-if="index > 0">,</template>
                  <router-link :key="id" :to="'/operation/' + id + '/list'">
                    {{ name }}
                  </router-link>
                </template>
              </td>
              <td>
                <b-button
                  v-if="isOwner(team)"
                  v-on:click="deleteTeam(team)"
                  variant="danger"
                  size="sm"
                >
                  <span v-if="toDelete === team.ID">Confirm?</span>
                  <span v-else>Delete</span>
                </b-button>
                <b-button
                  v-else
                  v-on:click="leaveTeam(team)"
                  variant="warning"
                  size="sm"
                >
                  <span v-if="toDelete === team.ID">Confirm?</span>
                  <span v-else>Leave</span>
                </b-button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="col">
          <label
            >New Team:
            <input type="text" placeholder="New Team" v-model="newTeamName"
          /></label>
          <b-button variant="info" v-on:click="createTeam">New Team</b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WasabeeOp from "../operation";
import { notify } from "../notify";
import {
  SetTeamState,
  SetTeamShareWD,
  SetTeamLoadWD,
  deleteTeamPromise,
  leaveTeamPromise,
  newTeamPromise,
} from "../server";
import { logEvent } from "../firebase";

import { loadMeAndOps } from "../sync";

export default {
  props: ["me"],
  data: () => ({
    newTeamName: "",
    toDelete: null,
  }),
  computed: {
    teams: function () {
      return this.me.Teams;
    },
    teamsOps: function () {
      const teams = {};
      const lsk = Object.keys(localStorage);
      for (const id of lsk) {
        if (id.length != 40) continue;
        const op = new WasabeeOp(localStorage[id]);
        if (!op || !op.ID) continue;
        for (const opteam of op.teamlist) {
          teams[opteam.teamid] = teams[opteam.teamid] || {};
          teams[opteam.teamid][op.ID] = op.name;
        }
      }
      return teams;
    },
  },
  methods: {
    refresh: function () {
      this.$emit("refresh");
    },
    createTeam: async function () {
      if (!this.newTeamName) {
        notify("specify new team name");
        return;
      }
      try {
        await newTeamPromise(this.newTeamName);
        await this.refresh();
      } catch (e) {
        notify(e, "warning", true);
        console.log(e);
      }
    },
    setTeamState: async function (team) {
      try {
        await SetTeamState(team.ID, team.State);
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    },
    setTeamShareWD: async function (team) {
      try {
        await SetTeamShareWD(team.ID, team.ShareWD);
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    },
    setTeamLoadWD: async function (team) {
      try {
        await SetTeamLoadWD(team.ID, team.LoadWD);
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    },
    uniqueOps: function (ops) {
      const m = new Map();
      for (const op of ops) {
        if (!m.has(op.ID)) m.set(op.ID, op);
      }
      return m.values();
    },
    isOwner: function (team) {
      return team.Owner == this.me.GoogleID;
    },
    deleteTeam: async function (t) {
      if (this.toDelete !== t.ID) this.toDelete = t.ID;
      else {
        try {
          await deleteTeamPromise(t.ID);
          logEvent("leave_group");
          await this.refresh();
        } catch (e) {
          console.log(e);
          notify(e, "warning");
        }
        this.toDelete = null;
      }
    },
    leaveTeam: async function (t) {
      if (this.toDelete !== t.ID) this.toDelete = t.ID;
      else {
        try {
          await leaveTeamPromise(t.ID);
          logEvent("leave_group");
          await this.refresh();
        } catch (e) {
          console.log(e);
          notify(e, "warning");
        }
        this.toDelete = null;
      }
    },
  },
};
</script>
