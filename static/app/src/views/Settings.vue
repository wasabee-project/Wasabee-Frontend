<template>
  <div class="container">
    <div class="row">
      <div class="col">
        <h1>Settings</h1>
        <div class="content-area">
          <div class="card mb-2">
            <div class="card-header">Agent Info</div>
            <div class="card-body">
              <div>
                Wasabee Name: <span class="agent-name">{{ me.name }}</span>
              </div>
              <div>
                V Name: <span class="agent-name">{{ me.vname }}</span>
              </div>
              <div>
                <a href="https://v.enl.one/" target="_new">V Status</a>:
                <span id="vstatus">
                  <a
                    v-if="me.Vverified"
                    :href="'https://v.enl.one/profile/' + me.enlid"
                    target="_new"
                    >verified</a
                  >
                </span>
              </div>
              <div>
                Rocks Name: <span class="agent-name">{{ me.rocksname }}</span>
              </div>
              <div>
                <a href="https://enl.rocks/" target="_new">enl.rocks Status</a>:
                <span id="rocksstatus">{{
                  me.rocks ? "verified" : "not verified"
                }}</span>
                <p>
                  <em
                    ><a
                      href="#tooltip"
                      class="tooltip-display"
                      data-toggle="tooltip"
                      title=".Rocks verification typically only takes place in relationship to anomolies. Lack of verification does not mean you don't have a .rocks account, it just means you've not been verified at an anomaly event"
                      >What is .Rocks verification?</a
                    ></em
                  >
                </p>
              </div>
              <div>
                GoogleID: <span class="agent-name">{{ me.GoogleID }}</span>
              </div>
              <div>
                Level: <span class="agent-name">{{ me.level }}</span>
                <p>
                  <em
                    >This information comes from
                    <a href="https://v.enl.one/">V</a> and/or
                    <a href="https://enlightened.rocks">.rocks</a>. If you have
                    an UnverifiedAgent_ name, please ensure your .Rocks and V
                    information is correct.</em
                  >
                </p>
              </div>
              <div>
                Intel Name: <span class="agent-name">{{ me.intelname }}</span>
              </div>
              <!-- <div>Intel Faction: <span class="agent-name">${me.intelfaction}</span> -->
              <p>
                <em
                  >This information is set by the IITC plugin. It should not be
                  trusted for authorization.</em
                >
              </p>
            </div>
          </div>
          <div class="card mb-2">
            <div class="card-header">Options</div>
            <div class="card-body">
              <label
                >Send Location:
                <input
                  id="locCheck"
                  type="checkbox"
                  v-model="sendLocation" /></label
              ><br />
              <label
                >Enable Anonymous Analytics:
                <input id="analytics" type="checkbox" v-model="analytics"
              /></label>
              <span class="small dim"
                >(this helps the developers improve Wasabee)</span
              >
            </div>
          </div>
          <div class="card mb-2">
            <div class="card-header">Telegram</div>
            <div class="card-body">
              <div v-if="me.Telegram" id="telegramContent">
                <div v-if="me.Telegram.Verified">
                  Telgram ID: {{ me.Telegram.ID }} (verified)
                </div>
                <div v-else-if="me.Telegram.Authtoken">
                  Step 2: Tell the bot (<a
                    :href="'tg://resolve?domain=' + botname"
                    >{{ botname }}</a
                  >)
                  <a
                    :href="
                      'https://telegram.me/' +
                      botname +
                      '?start=' +
                      me.Telegram.Authtoken
                    "
                    >{{ me.Telegram.Authtoken }}</a
                  >
                  to conclude verification.
                </div>
                <div v-else>
                  Step 1: Tell the bot (<a
                    :href="'tg://resolve?domain=' + botname"
                    >{{ botname }}</a
                  >)
                  <a
                    :href="
                      'https://telegram.me/' + botname + '?start=' + me.lockey
                    "
                    >{{ me.lockey }}</a
                  >
                  to start the verification process. If you have sent this to
                  the bot and this step still shows here, log out and back in.
                </div>
              </div>
              <div v-else>
                Tell the bot (<a :href="'tg://resolve?domain=' + botname">{{
                  botname
                }}</a
                >)
                <a
                  :href="
                    'https://telegram.me/' + botname + '?start=' + me.lockey
                  "
                  >{{ me.lockey }}</a
                >
                to start the verification process.
              </div>
            </div>
          </div>
          <div class="card mb-2">
            <div class="card-header">One Time Token</div>
            <div class="card-body">
              <div id="ott">{{ me.lockey }}</div>
              <div class="small dim">
                Use this to log into Wasabee-IITC if Google Oauth2 and Webview
                both fail
              </div>
            </div>
          </div>
          <div class="card mb-2">
            <div class="card-header">V API token</div>
            <div class="card-body">
              <div id="vapidiv">
                <input
                  type="text"
                  id="vapi"
                  placeholder="0123456789abcdef0123456789abcdef0123456789"
                  v-model.lazy="vapi"
                />
              </div>
              <div class="small dim">
                If you need to sync V teams with Wasabee, enter a valid V API
                token.
              </div>
            </div>
          </div>
        </div>
        <div class="card mb-2">
          <div class="card-header">V team import</div>
          <div class="card-body">
            <div id="vapidiv">
              <select name="vimportmode" v-model="vimportmode">
                <option value="team">Create one Wasabee team per V team</option>
                <option value="role">
                  Create one Wasabee team per V team/role pair
                </option>
              </select>
              <input
                type="button"
                id="vimport"
                value="V team import"
                v-on:click="vimport"
              />
            </div>
            <div class="small dim">
              This can potentially create a large number of Wasabee teams at
              once. Only use this if you are sure you need it.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WasabeeMe from "../me";
import { notify } from "../notify";
import { importVteams, setVAPIkey } from "../server";
import { startSendLoc, stopSendLoc } from "../loc";

export default {
  data: () => ({
    me: WasabeeMe.cacheGet(),
    botname: window.wasabeewebui.botname,
    vimportmode: "team",
  }),
  computed: {
    sendLocation: {
      get: () => localStorage["sendLocation"] == "true",
      set: (value) => {
        if (value) startSendLoc();
        else stopSendLoc();
      },
    },
    analytics: {
      get: () => localStorage["analytics"] == "true",
      set: (value) => {
        localStorage["analytics"] = value;
      },
    },
    vapi: {
      get: function () {
        return this.me.vapi;
      },
      set: function (value) {
        setVAPIkey(value).then(
          () => {
            this.me.vapi = value;
            notify("V API Key updated", "success");
          },
          (e) => {
            console.log(e);
            notify("V API Key update failed", "warning", true);
          }
        );
      },
    },
  },
  methods: {
    vimport: async function () {
      try {
        notify("starting V team import");
        await importVteams(this.vimportmode);
        notify("V team import complete", "success");
      } catch (e) {
        console.log(e);
        notify(
          "V team import failed (or is still being processed)",
          "warning",
          true
        );
      }
    },
  },
};
</script>
