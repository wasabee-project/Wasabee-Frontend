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
                  <template
                    v-for="(teamid, index) in filterTeamsID(op.teamlist)"
                  >
                    <template v-if="index > 0">,</template>
                    <router-link
                      :key="teamid"
                      :to="'/team/' + teamid + '/list'"
                    >
                      {{ getTeamName(teamid) }}
                    </router-link>
                  </template>
                </td>
                <td>
                  <b-button
                    v-if="op.own"
                    v-on:click="deleteOp(op)"
                    variant="danger"
                    size="sm"
                  >
                    <span v-if="toDelete === op.ID">Confirm?</span>
                    <span v-else>Delete</span>
                  </b-button>
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
import WasabeeOp from "../operation";
import { notify } from "../notify";
import { deleteOpPromise } from "../server";

import { loadMeAndOps } from "../sync";

export default {
  props: ["me"],
  data: () => ({
    toDelete: null,
  }),
  computed: {
    ops: function () {
      const ops = [];
      const lsk = new Set(this.me.Ops.map((o) => o.ID));
      for (const id of lsk) {
        const op = new WasabeeOp(localStorage[id]);
        if (!op || !op.ID) continue;
        ops.push(op);
      }
      ops.sort((a, b) => a.name.localeCompare(b.name));
      return ops.map((op) => ({
        ID: op.ID,
        comment: op.comment,
        own: op.creator == this.me.GoogleID,
        name: op.name,
        teamlist: op.teamlist,
      }));
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
    refresh: function () {
      this.$emit("refresh");
    },
    filterTeamsID: function (teams) {
      return new Set(
        teams.map((t) => t.teamid).filter((id) => this.teamMap.has(id))
      );
    },
    getTeamName: function (id) {
      return this.teamMap.get(id);
    },
    deleteOp: async function (op) {
      if (this.toDelete !== op.ID) this.toDelete = op.ID;
      else {
        try {
          await deleteOpPromise(op.ID);
          await this.refresh();
        } catch (e) {
          console.log(e);
          notify(e, "warning", true);
        }
        this.toDelete = null;
      }
    },
  },
};
</script>
