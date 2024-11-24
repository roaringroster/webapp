<template>
  <q-card 
    flat 
    bordered
    class="widget-card"
  >
    <q-card-section 
      v-if="title"
      class="q-py-sm"
    >
      <div class="text-subtitle1 text-weight-medium">{{ title }}</div>
    </q-card-section>

    <slot />
  </q-card>
</template>

<style lang="sass">
.widget-card .q-card__section
  padding-left: 12px
  padding-right: 12px
  padding-bottom: 8px
</style>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>
