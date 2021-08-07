<template>
  <div class="container-fluid">
    <LMap ref="map" style="height: calc(100vh - 300px); min-height: 200px">
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      <LMarker
        v-for="(key, id) in dkeys"
        :lat-lng="[key.Lat, key.Lng]"
        :title="key.Name"
        :key="id"
      >
        <LPopup :content="key.Name" />
      </LMarker>
    </LMap>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker, LPopup } from "vue2-leaflet";

export default {
  props: ["dkeys"],
  computed: {
    keys: function () {
      const keys = {};
      for (const key of this.dkeys) {
        keys[key.PortalID] = key;
      }
      return keys;
    },
  },
  mounted: function () {
    this.$refs.map.mapObject.fitBounds(
      this.dkeys.map((key) => {
        return [key.Lat, key.Lng];
      })
    );
  },
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
  },
};
</script>
