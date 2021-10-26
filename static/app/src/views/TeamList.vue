<template>
  <div class="container">
    <h1 id="teamName">{{ team.name }}</h1>
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">&nbsp;</th>
          <th scope="col">Agent</th>
          <th scope="col">Identity</th>
          <th scope="col">Sharing Location</th>
          <th scope="col">Sharing WD Keys</th>
          <th scope="col">Comment</th>
        </tr>
      </thead>
      <tbody id="teamTable">
        <tr v-for="agent in agents" :key="agent.id">
          <td><img :src="agent.pic" height="50" width="50" /></td>
          <td>{{ agent.name }}</td>
          <td>{{ agent.auths }}</td>
          <td>
            <img
              v-if="agent.shareLoc"
              :src="$CDN_URL + '/img/checkmark.png'"
              alt="sharing location"
            />
          </td>
          <td>
            <img
              v-if="agent.shareWD"
              :src="$CDN_URL + '/img/checkmark.png'"
              alt="sharing wd keys"
            />
          </td>
          <td>{{ agent.squad }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: ["team"],
  computed: {
    agents: function () {
      return this.team.agents.map((agent) => ({
        id: agent.id,
        pic: agent.pic,
        name: agent.name,
        auths: [
          [agent.Vverified, "V"],
          [agent.rocks, "Rocks"],
          [agent.intelname, "Intel"],
        ]
          .filter((a) => a[0])
          .map((a) => a[1])
          .join(" "),
        shareLoc: agent.state,
        shareWD: agent.shareWD,
        squad: agent.squad,
      }));
    },
  },
};
</script>
