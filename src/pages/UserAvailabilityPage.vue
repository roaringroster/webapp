<template>
  <q-page padding>
    <q-calendar-agenda
      ref="calendar"
      view="week"
      :locale="locale"
      :model-resources="[{}]"
      resource-key="value"
      resource-label="label"
      :weekday-breakpoints="[200, 100]"
      no-active-date
      animated
      :class="['availability-scheduler']"
    >
      <template #head-day="{ scope: { timestamp } }">
        <div class="q-calendar-agenda__head--weekday q-calendar__center q-calendar__ellipsis q-py-sm">
          <span class="q-calendar-agenda__head--weekday-label q-calendar__ellipsis">
            {{ $d(timestamp.date, "WeekdayLong") }}
          </span>
        </div>
      </template>

      <template #day="{ scope }">
        <div class="q-mt-xs"></div>
        <div
          v-for="(item, index) in getAvailability(scope)"
          :key="index"
          :title="$t('edit')"
          class="q-my-xs q-mx-xs q-pa-xs row items-center justify-center no-wrap line-height-12 border-primary radius-xs text-primary cursor-pointer"
          style="border-width: 1px; border-style: solid"
        >
          <div class="text-center">{{ item }}</div>
          <q-icon 
            name="edit" 
            size="1.25em"
            class="q-ml-xs"
          />
          <!-- <q-btn 
            icon="edit"
            round
            flat
            color="primary"
            size="10.5px"
          /> -->
        </div>
        <div class="q-mx-xs row justify-center">
          <q-btn
            icon="add"
            :title="$t('add')"
            no-caps
            flat
            dense
            color="primary"
            class="q-px-sm full-width radius-xs"
          />
        </div>
      </template>
    </q-calendar-agenda>

    <div class="q-mt-xl row justify-center">
      <q-input
        :model-value="formatNumber(weeklyHours)"
        @update:model-value="weeklyHours = positive(floatOrNull($event))"
        :debounce="debounce"
        :label="$t('weeklyHours')"
        inputmode="decimal"
        min="0"
        max="70"
      />
    </div>
  </q-page>
</template>

<style lang="sass">
.availability-scheduler
  container-type: inline-size
  .q-calendar-agenda__head
    border-bottom: 0px none
    line-height: 16px
  .q-calendar-agenda__head--day 
    border-bottom: 1px solid rgb(224, 224, 224)
  .q-calendar-agenda__head--weekday
    padding-top: 6px
  .q-calendar-agenda__day
    flex-basis: 100%
    border-top: 1px solid rgb(224, 224, 224)
  .q-calendar-agenda__day, .q-calendar-agenda__head--day 
    min-width: max(14.28%, 80px)
    @media (max-width: $breakpoint-xs-max)
      min-width: calc(50vw - 8px)
  .q-calendar-agenda
    overflow: auto
    scroll-snap-type: x mandatory
  .q-calendar-agenda__head--day
    scroll-snap-align: start
  .q-calendar-agenda__body
    overflow: unset
    &> *
      overflow: unset
      &> *
        overflow: unset
</style>

<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { QCalendarAgenda } from "@quasar/quasar-ui-qcalendar";
import { locale } from "src/boot/i18n";
import { debounce, floatOrNull, positive } from "src/helper/input";

const { n } = useI18n();

const dummyData = [
  [], 
  ["08.00 – 18.00"], 
  ["08.00 – 12.00", "17.00 – 22.00"],
  [], 
  ["08.00 – 18.00"], 
  ["12.00 – 18.00"], 
  [], 
];
const weeklyHours = ref(37.5);


const calendar: Ref<QCalendarAgenda | null> = ref(null);

type QCalendarTimestamp = {
  weekday: number;
  current: boolean;
  day: number;
  month: number;
  year: number;
};

type QCalendarScope = {
  days?: {date: string}[];
  cellWidth?: string;
  timestamp?: QCalendarTimestamp;
};

function getAvailability(scope: QCalendarScope) {
  const weekday = scope.timestamp?.weekday;

  if (weekday != undefined) {
    return dummyData[weekday];
  } else {
    return [];
  }
}


const formatNumber = (value: number | null, numberFormat = "") =>
  value != null
    ? n(value, numberFormat)
    : null

</script>
