<template>
  <router-view v-slot="{ Component, route }">
    <transition
      :name="(route.meta.transition as string)"
      @enter="isTransitioning = !!route.meta.transition"
      @leave="isTransitioning = false"
    >
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const isTransitioning = ref(false);

</script>
