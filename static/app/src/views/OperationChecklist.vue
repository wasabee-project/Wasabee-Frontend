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
          <li v-if="assignmentsOnly" class="list-group-item">
            <label
              >Agent:
              <select v-model="agent">
                <option v-for="a in agentList" :key="a.id" :value="a.id">
                  {{ a.name }}
                </option>
              </select>
            </label>
          </li>
        </ul>
      </div>
    </div>

    <table class="table table-striped" id="optable">
      <thead>
        <tr>
          <th @click="sort('opOrder')" scope="col">Order</th>
          <th scope="col">Portal</th>
          <th scope="col">To/Action</th>
          <th scope="col">Distance</th>
          <th @click="sort('assignedTo')" scope="col">Assigned To</th>
          <th scope="col">Description</th>
          <th @click="sort('zone')" scope="col">Zone</th>
          <th scope="col">Completed</th>
        </tr>
      </thead>
      <tbody id="opSteps">
        <tr
          v-for="step in steps"
          :key="step.ID"
          :class="{ 'table-success': step.completed }"
        >
          <td class="text-right">{{ step.opOrder }}</td>

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
            <b-button
              v-if="needAck(step)"
              v-on:click="ackMarker(step.ID)"
              variant="warning"
              size="sm"
            >
              ack
            </b-button>
          </td>
          <td>{{ step.comment }}</td>
          <td>{{ getZoneName(step.zone) }}</td>
          <td class="text-center">
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
import WasabeeTeam from "../team";
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
    me: null,
  },
  data: function () {
    return {
      sortBy: "opOrder",
      sortDesc: false,
      agent: this.me.GoogleID,
    };
  },
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
    steps: function () {
      let steps = this.operation.markers.concat(this.operation.links);
      if (this.assignmentsOnly)
        steps = steps.filter((s) => s.assignedTo == this.agent);
      steps.sort((a, b) => a.opOrder - b.opOrder);

      switch (this.sortBy) {
        case "assignedTo":
          steps.sort((a, b) =>
            this.getAgentName(a[this.sortBy]).localeCompare(
              this.getAgentName(b[this.sortBy])
            )
          );
          break;
        case "opOrder":
        case "zone":
          steps.sort((a, b) => a[this.sortBy] - b[this.sortBy]);
          break;
        default:
          break;
      }
      if (this.sortDesc) steps.reverse();

      return steps;
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
    getAgentName: function (id) {
      if (!id) return "";
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

      return dist + "km (L" + level + ")";
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
