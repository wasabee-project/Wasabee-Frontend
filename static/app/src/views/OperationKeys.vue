<template>
  <div class="container">
    <h1 id="opName">{{ operation.name }}</h1>
    <div class="row">
      <div class="col">
        <table class="table table-striped">
          <thead>
            <tr>
              <th @click="sort('name')">Portal</th>
              <th @click="sort('required')">Required</th>
              <th>
                <label @click="sort('agentRequired')">For </label>
                <select v-model="agent">
                  <option v-for="a in agentList" :key="a.id" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </th>
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
              @click="selectedKey = key.id"
            >
              <td><PortalLink :id="key.id" :operation="operation" /></td>
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
      </div>
      <div v-if="selectedKey && keyPortal" class="col col-md-4">
        <div class="card" style="position: sticky; top: 0">
          <div class="map">
            <LMap
              id="map"
              style="height: 300px"
              :center="keyPortal.latLng"
              :zoom="15"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                layer-type="base"
              />
              <LMarker :lat-lng="keyPortal.latLng" :title="keyPortal.name">
                <LIcon
                  :icon-url="
                    $CDN_URL + '/img/markers/wasabee_markers_key_done.svg'
                  "
                  :icon-size="[24, 40]"
                  :icon-anchor="[12, 40]"
                  :popup-anchor="[-1, -48]"
                />
              </LMarker>
            </LMap>
          </div>
          <div class="card-body">
            <h3>{{ keySummary.required }} keys required</h3>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Zone</th>
                  <th scope="col">requires</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in keySummary.zones" :key="entry.zone">
                  <td>{{ operation.zoneName(entry.zone) }}</td>
                  <td>{{ entry.count }}</td>
                </tr>
              </tbody>
            </table>
            <table class="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">has</th>
                  <th scope="col">requires</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, id) in keySummary.info"
                  :key="id"
                  :class="{
                    'table-warning': entry.required > entry.onHand,
                  }"
                >
                  <td>{{ getAgentName(id) }}</td>
                  <td>{{ entry.onHand }}</td>
                  <td>{{ entry.required }}</td>
                </tr>
                <tr v-if="keySummary.unassigned > 0">
                  <td>Unassigned links</td>
                  <td></td>
                  <td>{{ keySummary.unassigned }}</td>
                </tr>
              </tbody>
            </table>
            <a href="#" class="btn btn-primary" @click="selectedKey = null"
              >Close</a
            >
          </div>
        </div>
      </div>
    </div>
    <div class="row">
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
            <td><PortalLink :id="key.portalId" :operation="operation" /></td>
            <td>{{ key.agent }}</td>
            <td>{{ key.count }}</td>
            <td>{{ key.capsule }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon } from "vue2-leaflet";

import { notify } from "../notify";
import WasabeeTeam from "../team";
import { opKeyPromise } from "../server";

import PortalLink from "./PortalLink.vue";

export default {
  props: ["me", "operation"],
  data: () => ({
    sortBy: "name",
    sortDesc: false,
    agent: "",
    selectedKey: null,
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
        portalId: k.portalId,
        key: k.portalId + k.gid,
        agent: this.getAgentName(k.gid),
        count: k.onhand,
        capsule: k.capsule,
      }));
    },
    keysZones: function () {
      return this.operation.keysRequiredPerPortalPerZone();
    },
    keyPortal: function () {
      return this.selectedKey
        ? this.operation.getPortal(this.selectedKey)
        : null;
    },
    keySummary: function () {
      const keyInfo = {};
      const keyRequired = this.operation.KeysRequiredForPortalPerAgent(
        this.selectedKey
      );
      const keyTotalRequired = Object.values(keyRequired).reduce(
        (a, b) => a + b,
        0
      );
      const keyOnHand = this.operation.KeysOnHandForPortalPerAgent(
        this.selectedKey
      );
      for (const id in keyOnHand) {
        keyInfo[id] = { onHand: keyOnHand[id], required: 0 };
      }
      for (const id in keyRequired) {
        if (!(id in keyInfo)) keyInfo[id] = { onHand: 0, required: 0 };
        keyInfo[id].required += keyRequired[id];
      }
      const unassigned =
        "[unassigned]" in keyInfo ? keyInfo["[unassigned]"].required : 0;
      delete keyInfo["[unassigned]"];

      return {
        info: keyInfo,
        required: keyTotalRequired,
        unassigned: unassigned,
        zones: this.keysZones.filter((e) => e.to == this.selectedKey),
      };
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
  created: function () {
    this.agent = this.me.GoogleID;
  },
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    PortalLink,
  },
};
</script>
