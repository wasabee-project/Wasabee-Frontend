<template>
  <div class="container">
    <h1 id="teamName">{{ team.name }}</h1>
    <label>Add Agent:</label>
    <input
      type="text"
      placeholder="GoogleID or Agent Name"
      v-model="agentName"
    />
    <button v-on:click="addAgent">Add</button>
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">&nbsp;</th>
          <th scope="col">Agent</th>
          <th scope="col">Sharing Location</th>
          <th scope="col">Squad</th>
          <th scope="col">&nbsp;</th>
        </tr>
      </thead>
      <tbody id="teamTable">
        <tr v-for="agent in team.agents" :key="agent.id">
          <td><img :src="agent.pic" height="50" width="50" /></td>
          <td>{{ agent.name }}</td>
          <td>
            <img
              v-if="agent.state"
              :src="cdn + '/img/checkmark.png'"
              alt="sharing location"
            />
          </td>
          <td>
            <input
              v-model="agent.squad"
              v-on:change="agentSquadChange(agent)"
            />
          </td>
          <td>
            <button v-if="!team.RockCommunity" v-on:click="removeAgent(agent)">
              Remove
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { notify } from "../notify";
import {
  addAgentToTeamPromise,
  removeAgentFromTeamPromise,
  setAgentTeamSquadPromise,
} from "../server";

export default {
  props: ["team"],
  data: () => ({
    agentName: "",
    cdn: window.wasabeewebui.cdnurl,
  }),
  methods: {
    addAgent: function () {
      addAgentToTeamPromise(this.agentName, this.team.id).then(
        () => {
          this.$emit("refresh");
        },
        (reject) => {
          console.log(reject);
          notify(reject, "danger", true);
        }
      );
    },
    removeAgent: function (agent) {
      removeAgentFromTeamPromise(agent.id, this.team.id).then(
        () => {
          this.$emit("refresh");
        },
        (reject) => {
          notify(reject, "danger", true);
          console.log(reject);
        }
      );
    },
    agentSquadChange: function (agent) {
      setAgentTeamSquadPromise(agent.id, this.team.id, agent.squad).then(
        () => {
          //this.$emit("refresh");
        },
        (reject) => {
          notify(reject, "danger", true);
          console.log(reject);
        }
      );
    },
  },
};
</script>
