<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1 id="opName">{{ operation.name }}</h1>
        <LMap
          id="map"
          style="height: calc(100vh - 300px); min-height: 200px"
          :bounds="operation.mbr"
        >
          <LControlLayers
            position="topright"
            :hideSingleBase="true"
          ></LControlLayers>
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            layer-type="base"
          />
          <LLayerGroup name="Zones">
            <LPolygon
              v-for="z in zones.polygons"
              :key="z.id"
              :lat-lngs="z.points"
              :color="z.color"
              :fill-color="z.color"
            >
              <LPopup>{{ z.name }} </LPopup>
            </LPolygon>
          </LLayerGroup>
          <LLayerGroup
            v-for="(layer, name) in layers"
            :key="name"
            :name="name"
            layer-type="overlay"
          >
            <LMarker
              v-for="marker in layer.markers"
              :key="marker.ID"
              :lat-lng="getPortal(marker.portalId).latLng"
              :title="getPortal(marker.portalId).name"
            >
              <LIcon
                :icon-url="marker.icon"
                :icon-size="[24, 40]"
                :icon-anchor="[12, 40]"
                :popup-anchor="[-1, -48]"
              />
              <LPopup>
                {{ getPortal(marker.portalId).name }}
                <div v-if="marker.comment">{{ marker.comment }}</div>
                <div v-if="marker.status != 'pending'">{{ marker.status }}</div>
                <div v-if="marker.assignedTo">
                  {{ getAgentName(marker.assignedTo) }}
                </div>
                <b-button
                  target="_blank"
                  size="sm"
                  variant="outline-primary"
                  :href="
                    'https://www.google.com/maps/search/?api=1&query=' +
                    getPortal(marker.portalId).latLng.lat +
                    ',' +
                    getPortal(marker.portalId).latLng.lng
                  "
                  >Google Map</b-button
                >
              </LPopup>
            </LMarker>
            <LGeodesic
              v-for="link in layer.links"
              :key="link.ID"
              :lat-lngs="link.getLatLngs(operation)"
              :weight="2"
              :color="getLinkColor(link)"
              :opacity="0.75"
            />
            <LMarker
              v-for="anchor in layer.anchors"
              :key="anchor"
              :lat-lng="getPortal(anchor).latLng"
              :title="getPortal(anchor).name"
            >
              <LIcon
                :icon-url="cdn + '/img/markers/pin_lime.svg'"
                :icon-size="[24, 40]"
                :icon-anchor="[12, 40]"
                :popup-anchor="[-1, -48]"
              />
              <LPopup>
                {{ getPortal(anchor).name }}
                <div v-if="getPortal(anchor).comment">
                  {{ getPortal(anchor).comment }}
                </div>
                <div v-if="getPortal(anchor).hardness">
                  {{ getPortal(anchor).status }}
                </div>
                <b-button
                  target="_blank"
                  size="sm"
                  variant="outline-primary"
                  :href="
                    'https://www.google.com/maps/search/?api=1&query=' +
                    getPortal(anchor).latLng.lat +
                    ',' +
                    getPortal(anchor).latLng.lng
                  "
                  >Google Map</b-button
                >
              </LPopup>
            </LMarker>
          </LLayerGroup>
        </LMap>
      </div>
    </div>
  </div>
</template>

<script>
import {
  LMap,
  LTileLayer,
  LControlLayers,
  LLayerGroup,
  LPolygon,
  LMarker,
  LIcon,
  LPopup,
} from "vue2-leaflet";

import LGeodesic from "./LGeodesic.vue";

import WasabeeMe from "../me";

function newColors(incoming) {
  switch (incoming) {
    case "groupa":
      return "orange";
    case "groupb":
      return "yellow";
    case "groupc":
      return "lime";
    case "groupd":
      return "purple";
    case "groupe":
      return "teal";
    case "groupf":
      return "fuchsia";
    case "main":
      return "red";
    default:
      return incoming;
  }
}

export default {
  props: ["operation"],
  data: () => ({
    me: WasabeeMe.cacheGet(),
    cdn: window.wasabeewebui.cdnurl,
  }),
  computed: {
    zones: function () {
      return {
        polygons: this.operation.zones.filter(
          (z) => z.points && z.points.length > 2
        ),
      };
    },
    assignments: function () {
      const markers = this.operation.markers.filter(
        (m) => m.assignedTo == this.me.GoogleID
      );
      const links = this.operation.links.filter(
        (m) => m.assignedTo == this.me.GoogleID
      );
      const anchors = new Set();
      for (const link of links) {
        anchors.add(link.fromPortalId);
        anchors.add(link.toPortalId);
      }
      return {
        markers,
        links,
        anchors,
      };
    },
    others: function () {
      const markers = this.operation.markers.filter(
        (m) => m.assignedTo != this.me.GoogleID
      );
      const links = this.operation.links.filter(
        (m) => m.assignedTo != this.me.GoogleID
      );
      const anchors = new Set();
      for (const link of links) {
        anchors.add(link.fromPortalId);
        anchors.add(link.toPortalId);
      }
      return {
        markers,
        links,
        anchors,
      };
    },
    layers: function () {
      return {
        Assignments: this.assignments,
        Others: this.others,
      };
    },
  },
  methods: {
    getPortal: function (id) {
      return this.operation.getPortal(id);
    },
    getAgentName: function (id) {
      const agent = this.operation.getAgent(id);
      if (agent) return agent.name;
      return id;
    },
    getLinkColor: function (link) {
      return newColors(
        link.color == "main" ? this.operation.color : link.color
      );
    },
  },
  components: {
    LMap,
    LTileLayer,
    LControlLayers,
    LLayerGroup,
    LMarker,
    LIcon,
    LPopup,
    LPolygon,
    LGeodesic,
  },
};
</script>
