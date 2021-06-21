<template>
  <div class="container-fluid">
    <div class="card mb-2">
      <div class="card-header" id="opName">{{ operation.name }}</div>
      <div class="card-body">
        <ul class="list-group list-group-flush">
          <li class="list-group-item" id="opComment">
            Comment: {{ operation.comment }}
          </li>
          <!-- <li class="list-group-item"><a :href="'/api/v1/draw/' + operation.ID + '/stock'">Stock Intel Link</a></li> -->
          <li class="list-group-item">
            <strong
              ><a :href="'/api/v1/draw/' + operation.ID + '/myroute'"
                >My Route (assignments in order)</a
              >
              (Google Maps)</strong
            >
          </li>
        </ul>
      </div>
    </div>

    <table class="table table-striped" id="optable">
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Portal</th>
          <th scope="col">To/Action</th>
          <th scope="col">Distance</th>
          <th scope="col">Assigned To</th>
          <th scope="col">Description</th>
          <th scope="col">Zone</th>
          <th scope="col">Completed</th>
        </tr>
      </thead>
      <tbody id="opSteps">
        <tr v-for="step in steps" :key="step.ID">
          <td>{{ step.opOrder }}</td>

          <td v-if="isMarker(step)">
            <PortalLink :id="step.portalId" :operation="operation" />
          </td>
          <td v-if="isMarker(step)" :class="step.type">
            {{ step.friendlyType }}
          </td>
          <td v-if="isMarker(step)"></td>

          <td v-if="isLink(step)">
            <PortalLink :id="step.fromPortalId" :operation="operation" />
          </td>
          <td v-if="isLink(step)">
            <PortalLink :id="step.toPortalId" :operation="operation" />
          </td>
          <td v-if="isLink(step)">
            {{ calculateDistance(step) }}
          </td>
          <td>
            {{ getAgentName(step.assignedTo) }}
            <button v-if="needAck(step)" v-on:click="ackMarker(step.ID)">
              ack
            </button>
          </td>
          <td>{{ step.comment }}</td>
          <td>{{ getZoneName(step.zone) }}</td>
          <td>
            <input
              type="checkbox"
              v-model="step.completed"
              :disabled="step.assignedTo != me.GoogleID"
              v-on:change="complete(step)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <div id="opTable"></div>
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeMarker from "../marker";
import WasabeeLink from "../link";

import PortalLink from "./PortalLink.vue";

import { notify } from "../notify";
import { SetMarkerState, setAssignmentStatus } from "../server";

function fourthroot(a) {
  return Math.pow(Math.E, Math.log(a) / 4.0);
}

export default {
  props: {
    operation: null,
    assignmentsOnly: {
      default: false,
    },
  },
  data: () => ({
    me: WasabeeMe.cacheGet(),
  }),
  computed: {
    steps: function () {
      const steps = this.operation.markers.concat(this.operation.links);
      steps.sort((a, b) => {
        return a.opOrder - b.opOrder;
      });
      if (this.assignmentsOnly)
        return steps.filter((s) => s.assignedTo == this.me.GoogleID);
      return steps;
    },
  },
  methods: {
    getAgentName: function (id) {
      const agent = this.operation.getAgent(id);
      if (agent) return agent.name;
      return id;
    },
    isLink: function (step) {
      return step instanceof WasabeeLink;
    },
    isMarker: function (step) {
      return step instanceof WasabeeMarker;
    },
    needAck: function (step) {
      if (step instanceof WasabeeMarker) {
        return (
          !(step.state == "acknowledged" || step.state == "completed") &&
          step.assignedTo == this.me.GoogleID
        );
      }
      return false;
    },
    ackMarker: async function (id) {
      try {
        console.log("setting marker acknowledge");
        await SetMarkerState(this.operation.ID, id, "acknowledged");
        notify("acknowledged", "success");
        this.operation.update();
      } catch (e) {
        console.log(e);
        notify(e, "danger", true);
      }
    },
    calculateDistance: function (link) {
      const dist = Math.round(link.length(this.operation) / 10) / 100;

      let level = 1.0;
      if (dist > 0.016) {
        level = fourthroot(dist * 1000) / (2 * fourthroot(10));
      }
      if (level > 8) {
        level = 8;
      }
      level = Math.round(level * 10) / 10;

      return dist + "km (level " + level + ")";
    },
    getZoneName: function (id) {
      for (const z of this.operation.zones) {
        if (z.id == id) return z.name;
      }
      return "*";
    },
    complete: function (step) {
      setAssignmentStatus(this.operation, step, step.completed).then(
        () => {
          this.operation.update();
        },
        (reject) => {
          notify(reject, "danger", true);
          console.log(reject);
        }
      );
    },
  },
  components: {
    PortalLink,
  },
};
</script>
