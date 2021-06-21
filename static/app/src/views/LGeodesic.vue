<template>
  <div style="display: none">
    <slot v-if="ready"></slot>
  </div>
</template>

<script>
import Vue from "vue";
import L from "leaflet";
import "leaflet.geodesic";

import { findRealParent } from "vue2-leaflet";

const LGeodesic = Vue.extend({
  props: ["latLngs", "weight", "color", "opacity"],
  data() {
    return {
      ready: false,
      mapObject: null,
      parentContainer: null,
    };
  },
  mounted() {
    this.mapObject = new L.Geodesic(this.$props.latLngs, {
      weight: this.$props.weight,
      color: this.$props.color,
      opacity: this.$props.opacity,
    });
    L.DomEvent.on(this.mapObject, this.$listeners);
    this.ready = true;
    this.parentContainer = findRealParent(this.$parent);
    this.parentContainer.addLayer(this);
  },
  beforeDestroy() {
    this.parentContainer.removeLayer(this);
  },
});
export default LGeodesic;
</script>
