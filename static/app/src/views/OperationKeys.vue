<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1 id="opName">{{ operation.name }}</h1>
        <table class="table table-striped">
          <thead>
            <tr>
              <th @click="sort('name')">Portal</th>
              <th @click="sort('required')">Required</th>
              <th v-if="canWrite">
                <select v-model="agent">
                  <option v-for="a in agentList" :key="a.id" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </th>
              <th v-else @click="sort('agentRequired')">Agent needs</th>
              <th @click="sort('onHand')">Total</th>
              <th @click="sort('iHave')">Agent Count</th>
              <th @click="sort('capsule')">Capsule</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="key in klist"
              :key="key.id"
              :class="{
                'table-warning': key.agentRequired > key.iHave,
                'table-danger': key.required > key.onHand,
              }"
            >
              <td>{{ key.name }}</td>
              <td>{{ key.required }}</td>
              <td>{{ key.agentRequired }}</td>
              <td>{{ key.onHand }}</td>
              <td>
                <input
                  size="3"
                  v-on:change="keyChange(key)"
                  v-model.number="key.iHave"
                  :disabled="agent != me.GoogleID"
                />
              </td>
              <td>
                <input
                  size="10"
                  v-on:change="keyChange(key)"
                  v-model.lazy="key.capsule"
                  :disabled="agent != me.GoogleID"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <hr />
        <table class="table table-striped">
          <thead>
            <tr>
              <th scope="col">Portal</th>
              <th scope="col">Agent</th>
              <th scope="col">Count</th>
              <th scope="col">Capsule</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in koh" :key="key.key">
              <td>{{ key.name }}</td>
              <td>{{ key.agent }}</td>
              <td>{{ key.count }}</td>
              <td>{{ key.capsule }}</td>
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
import WasabeeTeam from "../team";
import { opKeyPromise } from "../server";

export default {
  props: ["operation", "canWrite"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
    sortBy: "name",
    sortDesc: false,
    agent: WasabeeMe.cacheGet().GoogleID,
  }),
  computed: {
    agentList: function () {
      const map = new Map();
      for (const tr of this.operation.teamlist) {
        const team = WasabeeTeam.cacheGet(tr.teamid);
        if (!team) continue;
        for (const agent of team.agents) map.set(agent.id, agent);
      }
      if (!map.size) return [{ id: this.me.GoogleID, name: this.me.name }];

      return Array.from(map.values());
    },
    klist: function () {
      const kmap = new Map();
      for (const a of this.operation.anchors) {
        const k = {};
        const links = this.operation.links.filter(function (link) {
          return link.toPortalId == a;
        });

        k.id = a;
        k.name = this.operation.getPortal(k.id).name;
        k.required = links.length;
        k.agentRequired = links.filter(
          (l) => l.assignedTo == this.agent
        ).length;
        k.onHand = 0;
        k.iHave = 0;
        k.capsule = "";
        if (k.required > 0) kmap.set(k.id, k);
      }

      for (const p of this.operation.markers.filter(
        (m) => m.type == "GetKeyPortalMarker"
      )) {
        if (!kmap.has(p.portalId)) {
          const k = {};
          k.id = p.portalId;
          k.name = this.operation.getPortal(k.id).name;
          k.required = 0;
          k.agentRequired = 0;
          k.onHand = 0;
          k.iHave = 0;
          k.capsule = "";
          kmap.set(k.id, k);
        }
      }

      const klist = [];
      for (const [id, k] of kmap) {
        const thesekeys = this.operation.keysonhand.filter(
          (kk) => kk.portalId == id
        );
        if (thesekeys && thesekeys.length > 0) {
          for (const t of thesekeys) {
            k.onHand += t.onhand;
            if (t.gid == this.agent) {
              k.iHave = t.onhand;
              k.capsule = t.capsule;
            }
          }
        }
        klist.push(k);
      }

      switch (this.sortBy) {
        case "name":
        case "capsule":
          klist.sort((a, b) => a[this.sortBy].localeCompare(b[this.sortBy]));
          break;
        case "required":
        case "agentRequired":
        case "onHand":
        case "iHave":
          klist.sort((a, b) => a[this.sortBy] - b[this.sortBy]);
          break;
        default:
          break;
      }
      if (this.sortDesc) klist.reverse();

      return klist;
    },
    koh: function () {
      const missing = { name: "[portal no longer in op]" };
      return this.operation.keysonhand.map((k) => ({
        name: (this.operation.getPortal(k.portalId) || missing).name,
        key: k.portalId + k.gid,
        agent: this.getAgentName(k.gid),
        count: k.onhand,
        capsule: k.capsule,
      }));
    },
  },
  methods: {
    sort: function (cat) {
      if (cat === this.sortBy) this.sortDesc = !this.sortDesc;
      else {
        this.sortBy = cat;
        this.sortDesc = false;
      }
    },
    keyChange: async function (key) {
      try {
        await opKeyPromise(this.operation.ID, key.id, key.iHave, key.capsule);
        this.$emit("refresh");
        notify("count updated", "success", false);
      } catch (e) {
        console.log(e);
        notify(e, "danger", true);
      }
    },
    getAgentName: function (id) {
      const agent = this.operation.getAgent(id);
      if (agent) return agent.name;
      return id;
    },
  },
};
</script>
