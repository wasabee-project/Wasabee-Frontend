<template>
  <div id="wasabeeContent">
    <div class="container">
      <div class="row">
        <div class="col">
          <h1>
            Teams <b-button v-on:click="refresh" variant="primary">↻</b-button>
          </h1>
          <table class="table table-striped">
            <thead class="thead">
              <tr>
                <th scope="col">Team</th>
                <th scope="col">Share Location</th>
                <th scope="col">Share WD Keys</th>
                <th scope="col">Load WD Keys</th>
                <th scope="col"></th>
                <th scope="col">Ops</th>
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
                  <router-link
                    :to="'/team/' + team.ID + '/list'"
                    v-on:click="teamClick(team.ID)"
                  >
                    {{ team.Name }}
                  </router-link>
                </td>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    v-model="team.State"
                    true-value="On"
                    false-value="Off"
                    v-on:change="setTeamState(team)"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    v-model="team.ShareWD"
                    true-value="On"
                    false-value="Off"
                    v-on:change="setTeamShareWD(team)"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    class="form-check-input"
                    v-model="team.LoadWD"
                    true-value="On"
                    false-value="Off"
                    v-on:change="setTeamLoadWD(team)"
                  />
                </td>
                <td>
                  <button v-if="isOwner(team)" v-on:click="deleteTeam(team)">
                    Delete
                  </button>
                  <button v-if="!isOwner(team)" v-on:click="leaveTeam(team)">
                    Leave
                  </button>
                </td>
                <td>
                  <router-link
                    v-for="(name, id) in teamsOps[team.ID]"
                    :key="id"
                    :to="'/operation/' + id + '/list'"
                  >
                    {{ name }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label
            >New Team:
            <input type="text" placeholder="New Team" v-model="newTeamName"
          /></label>
          <button v-on:click="createTeam">New Team</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeOp from "../operation";
import { notify } from "../notify";
import { displayOp } from "../displayOp";
import { displayTeam } from "../displayTeam";
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
  data: () => ({
    me: WasabeeMe.cacheGet(),
    newTeamName: "",
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
    refresh: async function () {
      try {
        await loadMeAndOps();
        this.me = WasabeeMe.cacheGet();
      } catch (e) {
        console.log(e);
        notify(e, "warning", true);
      }
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
    opClick: function (opID) {
      displayOp({ screen: "operation", op: opID, state: "main" });
    },
    teamClick: function (tid) {
      displayTeam({ screen: "team", team: tid, subscreen: "list" });
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
      try {
        await deleteTeamPromise(t.ID);
        logEvent("leave_group");
        await this.refresh();
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    },
    leaveTeam: async function (t) {
      try {
        await leaveTeamPromise(t.ID);
        logEvent("leave_group");
        await this.refresh();
      } catch (e) {
        console.log(e);
        notify(e, "warning");
      }
    },
  },
};
</script>
