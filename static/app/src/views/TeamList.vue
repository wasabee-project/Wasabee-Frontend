<template>
  <div class="container">
    <h1 id="teamName">{{ team.name }}</h1>
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">&nbsp;</th>
          <th scope="col">Agent</th>
          <th scope="col">Sharing Location</th>
          <th scope="col">Sharing WD Keys</th>
          <th scope="col">Squad</th>
        </tr>
      </thead>
      <tbody id="teamTable">
        <tr v-for="agent in agents" :key="agent.id">
          <td><img :src="agent.pic" height="50" width="50" /></td>
          <td>{{ agent.name }}</td>
          <td>
            <img
              v-if="agent.shareLoc"
              :src="cdn + '/img/checkmark.png'"
              alt="sharing location"
            />
          </td>
          <td>
            <img
              v-if="agent.shareWD"
              :src="cdn + '/img/checkmark.png'"
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
  data: () => ({
    cdn: window.wasabeewebui.cdnurl,
  }),
  computed: {
    agents: function () {
      return this.team.agents.map((agent) => ({
        id: agent.id,
        pic: agent.pic,
        name:
          !agent.rocks && !agent.Vverified && agent.intelname
            ? agent.intelname
            : agent.name,
        shareLoc: agent.state,
        shareWD: agent.shareWD,
        squad: agent.squad,
      }));
    },
  },
};
</script>
