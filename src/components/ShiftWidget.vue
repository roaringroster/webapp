<template>
  <widget-container
    :title="$t('myShifts')"
    class="cursor-pointer"
    @click="$router.push({name: 'roster'})"
  >
    <q-card-section class="q-pt-none">
      <div
        v-for="(item, key) in myShifts"
        :key="key"
        class="q-mb-sm"
      >{{ item }}</div>
    </q-card-section>
  </widget-container>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { useI18n } from "vue-i18n";
import { date } from "quasar";
import { Shift } from "src/models/roster";
import WidgetContainer from "src/components/WidgetContainer.vue";

const { addToDate } = date;
const { d } = useI18n();

const props = defineProps({
  shifts: {
    type: Array as PropType<Shift[]>,
    default: () => []
  },
  userId: {
    type: String,
    required: true,
  },
});

const formatDate = (days: number) => d(addToDate(new Date(), {days}), "DayMonthNumericWeekday");

const myShifts = computed(() => [
  `${formatDate(0)} 9–17 Uhr`,
  `${formatDate(2)} 9–17 Uhr, mit Charlie Clark`,
  `${formatDate(4)} 17–21 Uhr`,
  `${formatDate(6)} 8.30–17.30 Uhr, „Springer”`,
  `${formatDate(9)} 9–17 Uhr, mit Alice Adams`,
])

</script>
