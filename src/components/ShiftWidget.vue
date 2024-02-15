<template>
  <widget-container
    :title="'My Shifts'"
    class="cursor-pointer"
    @click="$router.push({name: 'roster'})"
  >
    <q-card-section class="q-pt-none">
      <span
        v-for="i in Math.ceil(Math.random() * 3)"
        :key="i"
      >Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.</span>
    </q-card-section>
  </widget-container>
</template>

<script setup lang="ts">
import WidgetContainer from "src/components/WidgetContainer.vue"
</script>
