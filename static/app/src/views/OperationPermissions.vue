<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1 id="opName">{{ operation.name }}</h1>
        <table class="table table-striped">
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Permission</th>
              <th scope="col">Zone</th>
              <th scope="col">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t of teams" :key="t.key">
              <td>{{ t.name }}</td>
              <td>{{ t.role }}</td>
              <td>{{ t.zoneName }}</td>
              <td><button v-on:click="removePerm(t)">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <label>
          Add Team:
          <select v-model="teamID">
            <option disabled>Team name:</option>
            <option v-for="t in me.Teams" :key="t.ID" :value="t.ID">
              {{ t.Name }}
            </option>
          </select>
          <select v-model="teamRole">
            <option disabled>Role:</option>
            <option value="read">Read</option>
            <option value="write">Write</option>
            <option value="assignedonly">Assigned only</option>
          </select>
          <select v-model="teamZone">
            <option value="0">All zones</option>
            <option v-for="z in operation.zones" :key="z.id" :value="z.id">
              {{ z.name }}
            </option>
          </select>
        </label>
        <button v-on:click="addPerm">Add</button>
      </div>
    </div>
  </div>
</template>
<script>
import { notify } from "../notify";
import WasabeeMe from "../me";
import WasabeeTeam from "../team";
import { addPermPromise, delPermPromise } from "../server";

export default {
  props: ["operation"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
    teamID: null,
    teamRole: null,
    teamZone: 0,
  }),
  computed: {
    teams: function () {
      return this.operation.teamlist.map((t) => {
        const team = WasabeeTeam.cacheGet(t.teamid);
        const name = team ? team.name : t.teamid;

        return {
          key: t.teamid + "/" + t.role + "/" + t.zone,
          id: t.teamid,
          name: name,
          role: t.role,
          zone: t.zone,
          zoneName: this.getZoneName(t.zone),
        };
      });
    },
  },
  methods: {
    getZoneName: function (id) {
      for (const z of this.operation.zones) {
        if (z.id == id) return z.name;
      }
      return "*";
    },
    removePerm: async function (t) {
      try {
        await delPermPromise(this.operation.ID, t.id, t.role, t.zone);
        this.$emit("refresh");
      } catch (e) {
        console.log(e);
        notify(e);
      }
    },
    addPerm: async function () {
      const teamID = this.teamID;
      const role = this.teamRole;
      const zone = this.teamZone;

      if (!teamID || !role) return;

      // avoid duplicate
      for (const t of this.operation.teamlist) {
        if (t.teamid == teamID && t.role == role && t.zone == zone) {
          notify("op already had that exact permission set", "warning");
          return;
        }
      }

      try {
        await addPermPromise(this.operation.ID, teamID, role, zone);
        this.$emit("refresh");
      } catch (e) {
        console.log(e);
        notify(e);
      }
    },
  },
};
</script>
