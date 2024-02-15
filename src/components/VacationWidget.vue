<template>
  <widget-container
    :title="$t('vacation')"
    class="cursor-pointer"
    @click="$router.push({name: 'absences'})"
  >
    <q-card-section class="q-pt-none">
      <div>{{ props.vacation.remaining }} {{ $t('daysRemainingLeave') }}</div>
      <div>{{ props.vacation.planned }} {{ $t('daysPlanned') }}</div>
      <div>{{ props.vacation.taken }} {{ $t('daysTaken') }}</div>
    </q-card-section>
  </widget-container>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import WidgetContainer from "src/components/WidgetContainer.vue";

export type VacationDays = {
  taken: 8
  planned: 17
  remaining: 5
};

const props = defineProps({
  vacation: {
    type: Object as PropType<VacationDays>,
    required: true
  },
});
</script>
