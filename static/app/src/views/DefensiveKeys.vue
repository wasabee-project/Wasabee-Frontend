<template>
  <div id="wasabeeContent">
    <div class="container">
      <div class="row">
        <h1>
          Defensive keys
          <b-button v-on:click="refresh()" variant="primary">↻</b-button>
        </h1>
        <table class="table table-striped">
          <thead>
            <tr>
              <th @click="sort('Name')">Portal</th>
              <th @click="sort('GID')">Agent</th>
              <th @click="sort('Count')">Agent Count</th>
              <th @click="sort('CapID')">Capsule</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in dkeys" :key="key.PortalID + key.GID">
              <td>{{ key.Name }}</td>
              <td>{{ getAgentName(key.GID) }}</td>
              <td>
                <input
                  size="3"
                  v-on:change="keyChange(key)"
                  v-model.number="key.Count"
                  :disabled="key.GID != me.GoogleID"
                />
              </td>
              <td>
                <input
                  size="10"
                  v-on:change="keyChange(key)"
                  v-model.lazy="key.CapID"
                  :disabled="key.GID != me.GoogleID"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { notify } from "../notify";
import WasabeeMe from "../me";
import WasabeeAgent from "../agent";
import { dKeyPromise, dKeylistPromise } from "../server";

export default {
  data: () => ({
    me: WasabeeMe.cacheGet(),
    sortBy: "Name",
    sortDesc: false,
    dkeys: [],
  }),
  methods: {
    sort: function (cat) {
      if (cat) {
        if (cat === this.sortBy) this.sortDesc = !this.sortDesc;
        else {
          this.sortBy = cat;
          this.sortDesc = false;
        }
      }
      switch (this.sortBy) {
        case "Name":
        case "CapID":
          this.dkeys.sort((a, b) =>
            a[this.sortBy].localeCompare(b[this.sortBy])
          );
          break;
        case "GID":
          this.dkeys.sort((a, b) =>
            this.getAgentName(a[this.sortBy]).localeCompare(
              this.getAgentName(b[this.sortBy])
            )
          );
          break;
        case "Count":
          this.dkeys.sort((a, b) => a[this.sortBy] - b[this.sortBy]);
          break;
        default:
          break;
      }
      if (this.sortDesc) this.dkeys.reverse();
    },
    keyChange: async function (key) {
      try {
        await dKeyPromise(JSON.stringify(key));
        if (key.Count < 1) {
          this.dkeys.splice(this.dkeys.indexOf(key), 1);
        }
        notify("count updated", "success", false);
      } catch (e) {
        console.log(e);
        notify(e, "danger", true);
      }
    },
    getAgentName: function (id) {
      const cachedAgent = WasabeeAgent.cacheGet(id);
      if (cachedAgent) return cachedAgent.name;
      return id;
    },
    refresh: function () {
      dKeylistPromise().then((j) => {
        this.dkeys = JSON.parse(j).DefensiveKeys;
        this.sort();
      });
    },
  },
  created() {
    this.refresh();
  },
};
</script>
