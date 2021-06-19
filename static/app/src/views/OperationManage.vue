<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="container-fluid">
    <div class="card mb-2">
      <div class="card-header" id="opName">{{ operation.name }}</div>
      <div class="card-body">
        <ul class="list-group list-group-flush">
          <textarea v-model.lazy="operation.comment"></textarea>
        </ul>
      </div>
    </div>

    <table class="table table-striped" id="optable">
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Portal</th>
          <th scope="col">&nbsp;</th>
          <th scope="col">To/Action</th>
          <th scope="col">Distance</th>
          <th scope="col">Zone</th>
          <th scope="col">Assigned To</th>
          <th scope="col">Description</th>
          <th scope="col">Completed</th>
        </tr>
      </thead>
      <draggable v-model="steps" tag="tbody">
        <tr v-for="step in steps" :key="step.ID">
          <td>{{ step.opOrder }}</td>

          <td v-if="isMarker(step)">
            <PortalLink :id="step.portalId" :operation="operation" />
          </td>
          <td v-if="isMarker(step)" :class="step.type">
            {{ step.friendlyType }}
          </td>
          <td v-if="isMarker(step)"></td>
          <td v-if="isMarker(step)"></td>

          <td v-if="isLink(step)">
            <PortalLink :id="step.fromPortalId" :operation="operation" />
          </td>
          <td v-if="isLink(step)">
            <a v-on:click="reverseLink(step)">
              <img :src="cdn + '/img/swap.svg'" height="16" />
            </a>
          </td>
          <td v-if="isLink(step)">
            <PortalLink :id="step.toPortalId" :operation="operation" />
          </td>
          <td v-if="isLink(step)">
            {{ calculateDistance(step) }}
          </td>
          <td>
            <select v-model="step.zone" v-on:change="setZone(step)">
              <option v-for="z in operation.zones" :key="z.id" :value="z.id">
                {{ z.name }}
              </option>
            </select>
          </td>
          <td>
            <select v-model="step.assignedTo" v-on:change="setAssign(step)">
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.name }}
              </option>
            </select>
          </td>
          <td>
            <input v-model.lazy="step.comment" v-on:change="setComment(step)" />
          </td>
          <td>
            <input
              type="checkbox"
              v-model="step.completed"
              :disabled="step.assignedTo != me.GoogleID"
              v-on:change="complete(step)"
            />
          </td>
        </tr>
      </draggable>
    </table>
  </div>
</template>

<script>
import WasabeeMe from "../me";
import WasabeeTeam from "../team";
import WasabeeAgent from "../agent";
import WasabeeMarker from "../marker";
import WasabeeLink from "../link";

import PortalLink from "./PortalLink.vue";

import draggable from "vuedraggable";

import { notify } from "../notify";
import {
  assignLinkPromise,
  assignMarkerPromise,
  setLinkComment,
  setMarkerComment,
  setLinkZone,
  setMarkerZone,
  setAssignmentStatus,
  reverseLinkDirection,
} from "../server";

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
    cdn: window.wasabeewebui.cdnurl,
  }),
  computed: {
    agents: function () {
      const teamset = new Set(this.operation.teamlist.map((t) => t.teamid));
      const agentset = new Set();
      for (const t of teamset) {
        const team = WasabeeTeam.cacheGet(t);
        if (team == null) continue;
        for (const a of team.agents) {
          agentset.add(a.id);
        }
      }
      const agents = [];
      for (const a of agentset) {
        agents.push(WasabeeAgent.cacheGet(a));
      }
      return agents;
    },
    steps: {
      get: function () {
        const steps = this.operation.markers.concat(this.operation.links);
        steps.sort((a, b) => {
          return a.opOrder - b.opOrder;
        });
        if (this.assignmentsOnly)
          return steps.filter((s) => s.assignedTo == this.me.GoogleID);
        return steps;
      },
      set: function (value) {
        const order = value.map((step) => step.ID);
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `${window.wasabeewebui.server}/api/v1/draw/${this.operation.ID}/order`
        );
        xhr.setRequestHeader(
          "Content-Type",
          "application/x-www-form-urlencoded"
        );
        xhr.onload = () => {
          if (xhr.status === 200) {
            this.$emit("refresh");
          } else {
            console.log(xhr.responseText);
            notify(xhr.responseText, "danger", true);
          }
        };
        xhr.send(encodeURI("order=" + order));
      },
    },
  },
  methods: {
    isLink: function (step) {
      return step instanceof WasabeeLink;
    },
    isMarker: function (step) {
      return step instanceof WasabeeMarker;
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
    setComment: async function (step) {
      try {
        if (this.isLink(step)) {
          await setLinkComment(this.operation.ID, step.ID, step.comment);
        } else {
          await setMarkerComment(this.operation.ID, step.ID, step.comment);
        }
        this.$emit("refresh");
      } catch (e) {
        notify(e, "danger", true);
        console.log(e);
      }
    },
    setAssign: async function (step) {
      try {
        if (this.isLink(step)) {
          await assignLinkPromise(this.operation.ID, step.ID, step.assignedTo);
        } else {
          await assignMarkerPromise(
            this.operation.ID,
            step.ID,
            step.assignedTo
          );
        }
        this.$emit("refresh");
      } catch (e) {
        notify(e, "danger", true);
        console.log(e);
      }
    },
    setZone: async function (step) {
      try {
        if (this.isLink(step)) {
          await setLinkZone(this.operation.ID, step.ID, step.zone);
        } else {
          await setMarkerZone(this.operation.ID, step.ID, step.zone);
        }
        this.$emit("refresh");
      } catch (e) {
        notify(e, "danger", true);
        console.log(e);
      }
    },
    reverseLink: async function (link) {
      try {
        await reverseLinkDirection(this.operation.ID, link.ID);
        this.$emit("refresh");
      } catch (e) {
        notify(e, "danger", true);
        console.log(e);
      }
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
    draggable,
  },
};
</script>
