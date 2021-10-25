<template>
  <a
    :href="
      'https://intel.ingress.com/?z=14&pll=' + portal.lat + ',' + portal.lng
    "
    target="_blank"
    >{{ portal.name }}</a
  >
</template>

<script>
const missing = { name: "[portal no longer in op]" };
export default {
  props: ["id", "operation"],
  data: () => ({}),
  computed: {
    portal: function () {
      return this.operation.getPortal(this.id) || missing;
    },
  },
};
</script>
