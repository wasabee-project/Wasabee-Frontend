<template>
  <div class="container">
    <div class="row">
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
          <tr v-for="key in sortedKeys" :key="key.PortalID + key.GID">
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
</template>

<script>
import { notify } from "../notify";
import WasabeeAgent from "../agent";
import { dKeyPromise } from "../server";

export default {
  props: ["dkeys", "me"],
  data: () => ({
    sortBy: "Name",
    sortDesc: false,
  }),
  computed: {
    sortedKeys: function () {
      const keys = Array.from(this.dkeys);
      switch (this.sortBy) {
        case "Name":
        case "CapID":
          keys.sort((a, b) => a[this.sortBy].localeCompare(b[this.sortBy]));
          break;
        case "GID":
          keys.sort((a, b) =>
            this.getAgentName(a[this.sortBy]).localeCompare(
              this.getAgentName(b[this.sortBy])
            )
          );
          break;
        case "Count":
          keys.sort((a, b) => a[this.sortBy] - b[this.sortBy]);
          break;
        default:
          break;
      }
      if (this.sortDesc) keys.reverse();
      return keys;
    },
  },
  methods: {
    sort: function (cat) {
      if (cat) {
        if (cat === this.sortBy) this.sortDesc = !this.sortDesc;
        else {
          this.sortBy = cat;
          this.sortDesc = false;
        }
      }
    },
    keyChange: async function (key) {
      try {
        await dKeyPromise(JSON.stringify(key));
        if (key.Count < 1) {
          this.$emit("refresh");
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
  },
};
</script>
