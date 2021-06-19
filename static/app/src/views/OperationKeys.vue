<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1 id="opName">{{ operation.name }}</h1>
        <table class="table table-striped">
          <thead>
            <tr>
              <th scope="col">Portal</th>
              <th scope="col">Required</th>
              <th scope="col">Total</th>
              <th scope="col">My Count</th>
              <th scope="col">Capsule</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in klist" :key="key.id">
              <td>{{ key.name }}</td>
              <td>{{ key.Required }}</td>
              <td>{{ key.onHand }}</td>
              <td>
                <input
                  size="3"
                  v-on:change="keyChange(key)"
                  v-model.number="key.iHave"
                />
              </td>
              <td>
                <input
                  size="10"
                  v-on:change="keyChange(key)"
                  v-model.lazy="key.capsule"
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
import { opKeyPromise } from "../server";

export default {
  props: ["operation"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
  }),
  computed: {
    klist: function () {
      const klist = new Map();
      for (const a of this.operation.anchors) {
        const k = {};
        const links = this.operation.links.filter(function (link) {
          return link.toPortalId == a;
        });

        k.id = a;
        k.name = this.operation.getPortal(k.id).name;
        k.Required = links.length;
        k.onHand = 0;
        k.iHave = 0;
        k.capsule = "";
        if (k.Required == 0) continue;

        const thesekeys = this.operation.keysonhand.filter(
          (kk) => kk.portalId == a
        );
        if (thesekeys && thesekeys.length > 0) {
          for (const t of thesekeys) {
            k.onHand += t.onhand;
            if (t.gid == this.me.GoogleID) {
              k.iHave = t.onhand;
              k.capsule = t.capsule;
            }
          }
        }
        klist.set(k.id, k);
      }

      for (const p of this.operation.markers.filter(
        (m) => m.type == "GetKeyPortalMarker"
      )) {
        if (klist.has(p.portalId)) {
          const key = klist.get(p.portalId);
          key.Required = "+ " + key.Required;
        } else {
          const k = klist.get(p.portalId);
          k.id = p.portalId;
          k.name = this.operation.getPortal(k.id).name;
          k.Required = "Not Specified";
          k.onHand = 0;
          k.iHave = 0;
          k.capsule = "";

          const thesekeys = this.operation.keysonhand.filter(
            (kk) => kk.portalId == k.id
          );
          if (thesekeys && thesekeys.length > 0) {
            for (const t of thesekeys) {
              k.onHand += t.onhand;
              if (t.gid == this.me.GoogleID) {
                k.iHave = t.onhand;
                k.capsule = t.capsule;
              }
            }
          }
          klist.set(k.id, k);
        }
      }
      return klist.values();
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
