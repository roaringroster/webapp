<template>
  <widget-container :title="$t('requests')">
    <q-card-section class="q-pt-none">
      <div
        v-for="(item, key) in requests"
        :key="key"
        class="q-mb-sm"
      >{{ item }}</div>
    </q-card-section>
  </widget-container>
</template>

<style lang="sass">
</style>

<script setup lang="ts">
import WidgetContainer from "src/components/WidgetContainer.vue";

const requests = [
  `⚠️ Eve Evans ist krank: wer kann wann Schichten übernehmen?`,
  `Es gibt noch 5 offene Schichten in der Woche 24.–30.11. – hast du Zeit?`,
  `Wer ist bereit die Schicht zu tauschen: mit Dave Diaz am 1.12. 17–23 Uhr?`,
];
</script>
