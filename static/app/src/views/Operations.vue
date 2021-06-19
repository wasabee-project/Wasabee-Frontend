<template>
  <div id="wasabeeContent">
    <div class="container">
      <div class="row">
        <div class="col">
          <h1>
            Operations
            <b-button v-on:click="refresh" variant="primary">↻</b-button>
          </h1>
          <table class="table table-striped">
            <thead class="thead">
              <tr>
                <th scope="col">Operation</th>
                <th scope="col">Comment</th>
                <th scope="col">Teams</th>
                <th>Commands</th>
              </tr>
            </thead>
            <tbody id="ops">
              <tr v-for="op in ops" :key="op.ID">
                <td>
                  <router-link :to="'/operation/' + op.ID + '/list'">{{
                    op.name
                  }}</router-link>
                </td>
                <td>{{ op.comment }}</td>
                <td>
                  <router-link
                    v-for="teamid in filterTeamsID(op.teamlist)"
                    :key="teamid"
                    :to="'/team/' + teamid + '/list'"
                  >
                    {{ getTeamName(teamid) }}
                  </router-link>
                </td>
                <td>
                  <button v-if="isOwner(op)" v-on:click="deleteOp(op)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
import { deleteOpPromise } from "../server";

import { loadMeAndOps } from "../sync";

export default {
  data: () => ({
    me: WasabeeMe.cacheGet(),
  }),
  computed: {
    ops: function () {
      const ops = [];
      const lsk = Object.keys(localStorage);
      for (const id of lsk) {
        if (id.length != 40) continue;
        const op = new WasabeeOp(localStorage[id]);
        if (!op || !op.ID) continue;
        ops.push(op);
      }
      return ops;
    },
    teamMap: function () {
      const teamMap = new Map();
      for (const t of this.me.Teams) {
        teamMap.set(t.ID, t.Name);
      }
      return teamMap;
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
    opClick: function (op) {
      displayOp({ screen: "operation", op: op.ID, state: "main" });
    },
    teamClick: function (team) {
      displayTeam({ screen: "team", team: team.teamid, subscreen: "list" });
    },
    filterTeamsID: function (teams) {
      return new Set(
        teams.map((t) => t.teamid).filter((id) => this.teamMap.has(id))
      );
    },
    getTeamName: function (id) {
      return this.teamMap.get(id);
    },
    isOwner: function (op) {
      return op.creator == this.me.GoogleID;
    },
    deleteOp: async function (op) {
      try {
        await deleteOpPromise(op.ID);
        await this.refresh();
      } catch (e) {
        console.log(e);
        notify(e, "warning", true);
      }
    },
  },
};
</script>
