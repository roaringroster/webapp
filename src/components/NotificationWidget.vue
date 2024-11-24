<template>
  <widget-container :title="$t('notifications')">
    <q-card-section class="q-pt-none">
      <div
        v-for="(item, key) in notifications"
        :key="key"
        class="q-mb-sm"
      >{{ item.message }}</div>
    </q-card-section>
  </widget-container>
</template>

<script setup lang="ts">
import WidgetContainer from "src/components/WidgetContainer.vue"

const notifications = [{
  time: "12:23",
  message: `Deine Schicht fällt aus am 29.11. 8.30–17.30 Uhr`
}, {
  time: "9:37",
  message: `Schichten getauscht: Du arbeitest am 4.12. 9–17 Uhr mit Alice Adams statt Bob Brown`
}, {
  time: "Gestern 16:42",
  message: `Neue Abwesenheit: Dave Diaz nimmt Urlaub in der Zeit 22.12.2024 – 4.1.2025`
}, {
  time: "Vorgestern 9:37",
  message: `Neues Team-Mitglied: Eve Evans (ab 18.11.)`
}];
</script>
