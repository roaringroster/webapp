<template>
  <icon-with-tooltip
    icon="fas fa-exclamation-triangle"
    color="negative"
    :tooltip="tooltip"
    :width="width"
    :top="top"
    :target="target"
    :action="action"
  />
</template>

<script setup lang="ts">
import { PropType } from "vue";
import IconWithTooltip from "src/components/IconWithTooltip.vue";

defineProps({
  tooltip: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "",
  },
  top: {
    type: Boolean,
    default: false,
  },
  target: {
    type: [Boolean, String, Object] as PropType<boolean | string | Element>,
    default: true,
  },
  action: {
    type: Function
  },
});

</script>