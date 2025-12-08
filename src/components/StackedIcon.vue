<template>
  <span
    :class="['q-icon', color ? 'text-' + color : '']"
    :style="`font-size: ${fontSize}`"
  >
    <span
      class="fa-stack"
      style="width: 2em; font-size: 0.5em"
    >
      <i 
        v-for="(icon, key) in icons"
        :key="key"
        :class="icon"
      ></i>
    </span>
  </span>
</template>

<style lang="sass">
.shrink-1
  scale: .875
.down-1
  translate: 0 .125em
</style>

<script setup lang="ts">
import { computed, PropType } from "vue";

const props = defineProps({
  /**
   * example: [
   *   'fas fa-square fa-stack-2x', 
   *   'fab fa-twitter fa-stack-1x fa-inverse text-yellow'
   * ]
   * more examples: https://docs.fontawesome.com/web/style/stack
   */
  icons: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  color: {
    type: String
  },
  size: {
    type: String,
    default: "sm"
  },
});

const fontSize = computed(() => {
  if (props.size == "xs") {
    return "18px";
  } else if (props.size == "sm") {
    return "24px";
  } else if (props.size == "md") {
    return "32px";
  } else if (props.size == "lg") {
    return "38px";
  } else if (props.size == "xl") {
    return "46px";
  } else if (props.size) {
    return props.size;
  } else {
    return "";
  }
});
</script>