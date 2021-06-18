<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1 id="teamName">{{ team.name }}</h1>
        <LMap id="map" style="height: 100vh">
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          />
          <LMarker
            v-for="agent in team.agents"
            :lat-lng="agent"
            :title="agent.name"
            :key="agent.id"
          >
            <LIcon
              :icon-url="agent.pic"
              :icon-size="[41, 41]"
              :icon-anchor="[25, 41]"
              :popup-anchor="[-1, -48]"
            />
            <LPopup :content="agent.name" />
          </LMarker>
        </LMap>
      </div>
    </div>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LIcon, LPopup } from "vue2-leaflet";

export default {
  props: ["team"],
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LIcon,
    LPopup,
  },
};
</script>
