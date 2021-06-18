<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1 id="teamName">{{ team.name }}</h1>
        <div class="card mb-2">
          <div class="card-header">Join Link</div>
          <div v-if="team.jlt" class="card-body">
            <a :href="'/api/v1/team/' + team.id + '/join/' + team.jlt"
              >copy this link</a
            >
            to share with agents
            <button v-on:click="removeJoinLink">remove</button>
          </div>
          <div v-if="!team.jlt" class="card-body">
            <button v-on:click="generateJoinLink">Generate Join Link</button>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">Admin Functions</div>
          <div class="card-body">
            <div>
              <label
                >Rename Team <input v-on:change="renameTeam" v-model="teamName"
              /></label>
            </div>
            <div>
              <hr />
              <label>Delete this team </label
              ><button v-on:click="deleteTeam">Delete</button>
            </div>
          </div>
        </div>

        <div class="card mb-2">
          <div class="card-header">enlightened.rocks Integration</div>
          <div class="card-body">
            <div>
              Rocks Community Identifier:
              <input
                type="text"
                v-model="team.rc"
                placeholder="afdviaren.com"
                v-on:change="updateRocks"
              />
              <span class="dim small"
                >Typically looks like "randomstring.com"</span
              >
            </div>
            <div>
              Rocks Community API Key:
              <input
                type="text"
                v-model="team.rk"
                placeholder="VnNfDerpL1nKsppMerZvwaXX"
                v-on:change="updateRocks"
              />
              <span class="dim small">24 letter string</span>
            </div>
            <div class="dim small">
              If you want this team to have its membership populated from an
              .rocks community, you will need to get the community ID and API
              key from the community's settings and add them here. Do not do
              this unless you trust the enl.rocks community.
            </div>
            <button v-on:click="pullRocks">
              Pull associated enl.rocks community members onto this team
            </button>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">V integration</div>
          <div class="card-body">
            <div>
              V Team ID #:
              <input
                type="text"
                v-model="team.vt"
                v-on:change="updateV"
                placeholder="1234"
              />
            </div>
            <div>
              V Team Role:
              <select id="vrole" v-model="team.vr" v-on:change="updateV">
                <option value="0">All</option>
                <option value="1">Planner</option>
                <option value="2">Operator</option>
                <option value="3">Linker</option>
                <option value="4">Keyfarming</option>
                <option value="5">Cleaner</option>
                <option value="6">Field Agent</option>
                <option value="7">Item Sponsor</option>
                <option value="8">Key Transport</option>
                <option value="9">Recharging</option>
                <option value="10">Software Support</option>
                <option value="11">Anomaly TL</option>
                <option value="12">Team Lead</option>
                <option value="13">Other</option>
                <option value="100">Team-0</option>
                <option value="101">Team-1</option>
                <option value="102">Team-2</option>
                <option value="103">Team-3</option>
                <option value="104">Team-4</option>
                <option value="105">Team-5</option>
                <option value="106">Team-6</option>
                <option value="107">Team-7</option>
                <option value="108">Team-8</option>
                <option value="109">Team-9</option>
                <option value="110">Team-10</option>
                <option value="111">Team-11</option>
                <option value="112">Team-12</option>
                <option value="113">Team-13</option>
                <option value="114">Team-14</option>
                <option value="115">Team-15</option>
                <option value="116">Team-16</option>
                <option value="117">Team-17</option>
                <option value="118">Team-18</option>
                <option value="119">Team-19</option>
              </select>
            </div>
            <div class="dim small">
              You must set a valid V API token in your settings tab.
            </div>
            <button v-on:click="pullV">
              Pull associated V team/role members onto this team
            </button>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">Send Announcement</div>
          <div class="card-body">
            <textarea v-model="announcement"></textarea>
            <button v-on:click="sendAnnouncement">Send</button>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">Change Ownership</div>
          <div class="card-body">
            <input
              type="text"
              placeholder="new owner"
              v-model="newOwner"
              v-on:change="changeOwner"
            />
            <div class="dim small">
              agent name or googleID -- once you change ownership, you can no
              longer manage this team
            </div>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">Team Info</div>
          <div class="card-body">
            Wasabee Team ID: <span id="teamid">{{ team.id }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-mutating-props */
import { notify } from "../notify";
import {
  renameTeamPromise,
  deleteTeamPromise,
  createJoinLinkPromise,
  deleteJoinLinkPromise,
  rocksPromise,
  pullRocks,
  configV,
  pullV,
  sendAnnounce,
  changeTeamOwnerPromise,
} from "../server";

export default {
  props: ["team"],
  data: () => ({
    teamName: "",
    announcement: "",
    newOwner: "",
  }),
  methods: {
    renameTeam: function () {
      renameTeamPromise(this.team.id, this.teamName).then(
        () => {
          this.team.name = this.teamName;
        },
        (reject) => {
          console.log(reject);
          notify(reject, "danger");
        }
      );
    },
    deleteTeam: function () {
      deleteTeamPromise(this.team.id).then(
        () => {
          this.$router.push({ path: "/" });
        },
        (reject) => {
          console.log(reject);
          notify(reject, "danger");
        }
      );
    },
    generateJoinLink: function () {
      createJoinLinkPromise(this.team.id).then(
        (resolve) => {
          const json = JSON.parse(resolve);
          this.team.jlt = json.Key;
        },
        (reject) => {
          console.log(reject);
          notify(reject, "danger", true);
        }
      );
    },
    removeJoinLink: function () {
      deleteJoinLinkPromise(this.team.id).then(
        () => {
          this.team.jlt = "";
        },
        (reject) => {
          console.log(reject);
          notify(reject, "danger", true);
        }
      );
    },
    updateRocks: function () {
      rocksPromise(this.team.id, this.team.rc, this.team.rk).then(
        () => {},
        (reject) => {
          console.log(reject);
          notify(reject, "danger");
        }
      );
    },
    pullRocks: function () {
      pullRocks(this.team.id).then(
        () => {
          notify("Rocks Community fetched", "success");
          this.$emit("refresh");
        },
        (reject) => {
          notify(reject, "danger");
          console.log(reject);
        }
      );
    },
    updateV: async function () {
      try {
        await configV(this.team.id, this.team.vt, this.team.vr);
        notify("updated V team link");
      } catch (e) {
        console.log(e);
        notify(e, "danger", true);
      }
    },
    pullV: function () {
      pullV(this.team.id).then(
        () => {
          notify("V Team fetched", "success");
          this.$emit("refresh");
        },
        (reject) => {
          notify(reject, "danger");
          console.log(reject);
        }
      );
    },
    sendAnnouncement: function () {
      sendAnnounce(this.team.id, this.announce);
      this.announce = "";
      notify("Message Sent");
    },
    changeOwner: function () {
      changeTeamOwnerPromise(this.team.id, this.newOwner).then(
        () => {
          this.$emit("refresh");
        },
        (reject) => {
          this.newOwner = "";
          console.log(reject);
          notify(reject, "danger", true);
        }
      );
    },
  },
};
</script>
