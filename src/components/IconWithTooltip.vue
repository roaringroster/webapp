<template>
  <div 
    :class="action ? 'cursor-pointer' : (tooltip ? 'cursor-help' : '')"
    style="line-height: 0.99"
    @click.stop="action?.()"
  >
    <q-icon
      :name="icon"
      :color="color"
      :size="size"
    >
      <q-tooltip
        :offset="$q.platform.is.mobile ? [0,10] : [0,4]"
        v-if="tooltip"
        :target="target"
        :max-width="maxWidth"
        :anchor="(top || $q.platform.is.mobile ? 'top middle' : 'bottom middle')"
        :self="(top || $q.platform.is.mobile ? 'bottom middle' : 'top middle')"
        :transition-show="top || $q.platform.is.mobile ? 'jump-up' : 'jump-down'"
        :transition-hide="top || $q.platform.is.mobile ? 'jump-down' : 'jump-up'"
        :class="tooltipClass"
        style="font-size: 0.8rem"
      >
        <simplified-markdown :text="tooltip" />
      </q-tooltip>
    </q-icon>
    <q-resize-observer @resize="parentWidth = $event.width + 'px'" />
  </div>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from "vue";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";

const props = defineProps({
  icon: {
    type: String,
    default: "",
  },
  color: {
    type: String,
    default: "grey-7",
  },
  size: {
    type: String,
  },
  tooltip: {
    type: String,
    default: "",
  },
  width: {
    type: String,
    default: "",
  },
  tooltipClass: {
    type: String,
    default: "text-center",
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

const parentWidth = ref("100%");
const maxWidth = computed(() => props.width || parentWidth.value);

</script>