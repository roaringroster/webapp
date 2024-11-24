<template>
  <widget-container
    :title="$t('vacation')"
    class="cursor-pointer"
    @click="$router.push({name: 'absences'})"
  >
    <q-card-section class="q-pt-none" style="padding-left: 8px; padding-right: 8px">
      <div class="row q-col-gutter-x-sm items-center no-wrap">
        <div style="width: 84px">
          <Doughnut 
            ref="chart"
            :data="chartData" 
            :options="options" 
            :height="200"
          />
        </div>
        <div class="overflow-hidden">
          <div
            v-for="(item , key) in vacation"
            :key="key"
            class="vacation-widget-item ellipsis"
          >
            <span :class="'text-' + item.color">{{ item.value }}</span>
            {{ item.label }}
          </div>
        </div>
      </div>
    </q-card-section>
  </widget-container>
</template>

<style lang="sass">
.vacation-widget-item
  line-height: 1.4rem
  span
    font-weight: bold
    font-size: 1.2em
  &:first-child
    span
      font-size: 2em
</style>

<script setup lang="ts">
import { PropType } from "vue";
import { useI18n } from "vue-i18n";
import { Doughnut } from "vue-chartjs";
import { Chart, DoughnutController, ArcElement } from "chart.js";
import { getCssVar } from "quasar";
import WidgetContainer from "src/components/WidgetContainer.vue";

Chart.register(DoughnutController, ArcElement);

const { t } = useI18n();

export type VacationDays = {
  taken: number;
  planned: number;
  remaining: number;
};

const props = defineProps({
  vacation: {
    type: Object as PropType<VacationDays>,
    required: true
  },
});

const colors = ["primary", "secondary", "ternary"];
const backgroundColor = colors.map(name => getCssVar(name) || "#cccccc");
const chartData = {
  labels: [new Date("2021-05-01"), new Date()],
  datasets: [{
    data: Object.values(props.vacation),
    backgroundColor,
    borderWidth: 1,
    hoverBorderColor: "#ffffff",
  }]
};
const options = {
  responsive: true,
  cutout: "55%",
};

const vacation = [{
  label: t("daysRemainingLeave"),
  value: props.vacation.remaining,
  color: colors.at(2),
},{
  label: t("daysPlanned"),
  value: props.vacation.planned,
  color: colors.at(1),
},{
  label: t("daysTaken"),
  value: props.vacation.taken,
  color: colors.at(0),
}]

</script>
