<template>
  <q-card flat bordered>
    <q-card-section v-if="title" class="q-py-sm">
      <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
    </q-card-section>

    <slot />
  </q-card>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>
