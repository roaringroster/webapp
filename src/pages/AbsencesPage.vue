<template>
  <q-page padding class="non-selectable">
    <div class="row q-mb-sm justify-center items-center no-wrap">
      <div>
        <q-btn
          icon="fas fa-caret-left"
          color="primary"
          flat
          round
          dense
          size="18px"
          @click="calendar?.prev()"
        />
      </div>
      <div class="row justify-center items-center no-wrap q-pr-xs selected-week">
        <div>
          <q-btn
            icon="event"
            round
            flat
            color="primary"
          >
            <q-popup-proxy
              ref="dateProxy"
              transition-show="jump-down"
              transition-hide="jump-up"
            >
              <q-date
                :modelValue="toUTC(currentDate).toISOString().substring(0, 10)"
                @update:model-value="gotoDate"
                color="primary"
                event-color="primary"
                mask="YYYY-MM-DD"
                today-btn
                :first-day-of-week="0"
              />
            </q-popup-proxy>
          </q-btn>
        </div>
        <div class="label row items-baseline q-gutter-x-sm">
          <div class="text-h6 line-height-12">{{ $d(currentDate, "MonthYear") }}</div>
        </div>
      </div>
      <div>
        <q-btn
          icon="fas fa-caret-right"
          color="primary"
          flat
          round
          dense
          size="18px"
          @click="calendar?.next()"
        />
      </div>
    </div>

    <q-calendar-scheduler
      v-if="members.length > 0"
      ref="calendar"
      view="month"
      :locale="locale"
      :modelValue="toUTC(currentDate).toISOString().substring(0, 10)"
      @update:model-value="gotoDate"
      v-model:model-resources="members"
      resource-key="value"
      resource-label="label"
      :resource-min-height="44"
      :cell-width="40"
      no-active-date
      animated
      class="absence-scheduler"
      style="margin-bottom: 80px"
      :weekday-class="weekdayClass"
      :day-class="weekdayClass"
    >
      <template #resource-label="{ scope: { resource } }">
        <q-item-label 
          :lines="2" 
          class="text-body2 q-mr-xs text-black"
        >
          {{ resource.label }}
        </q-item-label>
      </template>
      <template #resource-days="{ scope }">
        <template
          v-for="(event, index) in getEvents(scope)"
          :key="index"
        >
          <q-badge
            :color="colorForAbsenceReason(event.absence.reason)"
            @click="editAbsence(event.absence)"
            :style="event.style"
            :class="['absence-event cursor-pointer q-pa-none'].concat(event.classes)"
            rounded
          >
            <text-with-tooltip
              :text="event.label"
              :tooltip="[event.label, event.absence.comment].filter(Boolean).join(' – ')"
              width="200px"
              :icon-class="!event.absence.comment ? 'hidden' : ''"
              top
              class="full-width text-weight-medium ellipsis q-px-sm q-py-xs"
            />
          </q-badge>
        </template>
      </template>
    </q-calendar-scheduler>
    <div v-else class="q-mt-xl text-body2 text-italic text-center">{{ $t("noData") }}</div>

    <q-page-sticky
      position="bottom-left"
      :offset="[16, 10]"
      style="z-index: 1"
    >
      <q-btn
        fab
        icon="fa fa-add"
        :title="$t('addItem', [$t('absence')])"
        color="primary-gradient"
        @click="addAbsence"
      />
    </q-page-sticky>
  </q-page>
</template>

<style lang="sass">
.selected-week
  min-width: 218px
  @media (min-width: $breakpoint-xs-max)
    min-width: 280px
.absence-scheduler
  .q-calendar-scheduler__head--resources, .q-calendar-scheduler__resource
    min-width: 148px
.absence-event
  position: absolute
  top: 10px
  height: 24px
  box-shadow: 0px 2px 5px #ccc
  &.no-left-radius
    border-bottom-left-radius: 0
    border-top-left-radius: 0
  &.no-right-radius
    border-bottom-right-radius: 0
    border-top-right-radius: 0
</style>

<script setup lang="ts">
import { Ref, computed, ref, toRaw, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { QPopupProxy, useQuasar } from "quasar";
import { QCalendarScheduler } from "@quasar/quasar-ui-qcalendar";
import { v4 } from "uuid";
import { locale } from "src/boot/i18n";
import { useChangeHistory, useDocument } from "src/api/repo";
import { findOrCreate } from "src/api/repo";
import { toUTC } from "src/helper/date";
import { Absence, AbsenceList, createAbsenceList } from "src/models/absence";
import { colorForAbsenceReason } from "src/models/organization";
import AbsenceSheet from "src/components/AbsenceSheet.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";

const $q = useQuasar();
const { t } = useI18n();

// - Automerge

type TeamMembers = {members: {label: string; value: string;}[]};

const teamMembersId = findOrCreate<TeamMembers>("demo_teammembers", { members: [
  { label: "Alice", value: v4() },
  { label: "Bob", value: v4() },
  { label: "Charlie", value: v4() },
  { label: "Dave", value: v4() },
  { label: "Eve", value: v4() },
]});
const teamMembers = useDocument<TeamMembers>(teamMembersId);
const members = computed(() => teamMembers.doc.value?.members || [])

const absenceListId = findOrCreate<AbsenceList>("demo_absencelist", createAbsenceList());
const absenceList = useDocument<AbsenceList>(absenceListId);

useChangeHistory(() => absenceList.doc.value, "absences");

onUnmounted(() => {
  teamMembers.cleanup();
  absenceList.cleanup();
});

// teamMembersId.then(value => console.log(value, "teamMembersId"));
// absenceListId.then(value => console.log(value, "absenceListId"));

// – Data

const absences = computed(() => absenceList.doc.value?.absences || []);

function addAbsence() {
  $q.dialog({
    component: AbsenceSheet,
    componentProps: { teamMembers: members.value }
  })
  .onOk((absence: Absence) => {
    absenceList.changeDoc(doc => doc.absences.push(absence));
  });
}

function editAbsence(absence: Absence) {
  $q.dialog({
    component: AbsenceSheet,
    componentProps: {
      modelValue: toRaw(absence),
      teamMembers: members.value
    }
  })
  .onOk((newValue?: Absence) => {
    const index = absences.value.indexOf(absence);

    if (index >= 0) {
      if (newValue) {
        absenceList.changeDoc(doc => doc.absences[index] = newValue);
      } else {
        absenceList.changeDoc(doc => doc.absences.splice(index, 1));
      }
    }
  });
}

// – Navigation

const dateProxy: Ref<QPopupProxy | null> = ref(null);
const currentDate = ref(new Date());

function gotoDate(value: string | null) {
  if (value) {
    currentDate.value = new Date(value);
  }
  
  dateProxy.value?.hide();
}

// – Scheduler

const calendar: Ref<QCalendarScheduler | null> = ref(null);

type QCalendarScope = {
  resource: { value: string},
  days: {date: string}[],
  cellWidth: string,
  timestamp: {weekday: number, current: boolean}
};

function getEvents(scope: QCalendarScope) {
  const start = new Date(scope.days.at(0)?.date + "T00:00:00.000Z").getTime();
  const end = new Date(scope.days.at(-1)?.date + "T23:59:59.999Z").getTime();

  return absences.value
    .filter(absence => 
      absence.absenteeId == scope.resource.value
        && absence.start.getTime() <= end
        && absence.end.getTime() >= start
    )
    .map(absence => ({
      absence,
      label: t(absence.reason),
      style: {
        left: getLeft(absence, start, scope.cellWidth),
        width: getWidth(absence, start, end, scope.cellWidth),
      },
      classes: [
        absence.start.getTime() < start ? "no-left-radius" : "",
        end < absence.end.getTime() ? "no-right-radius" : "",
      ].filter(Boolean)
    }));
}

function getLeft(absence: Absence, scopeStart: number, width: string) {
  const start = scopeStart <= absence.start.getTime()
    ? (absence.start.getDate() - 1 + absence.start.getHours() / 24)
    : 0;
  return start * parseFloat(width) - 1 + (width.endsWith("%") ? "%" : "px");
}

function getWidth(absence: Absence, scopeStart: number, scopeEnd: number, width: string) {
  const duration = Math.round(
      (
        Math.min(absence.end.getTime(), scopeEnd) 
        - Math.max(absence.start.getTime(), scopeStart)
      ) 
      / (12 * 3_600_000)
    ) / 2;
  return duration * parseFloat(width) - 1 + (width.endsWith("%") ? "%" : "px");
}

function weekdayClass(data: {scope: QCalendarScope}) {
  const timestamp = data.scope.timestamp;
  return {
    "bg-primary-light": timestamp.current,
    "bg-weekend": !timestamp.current && [0, 6].includes(timestamp.weekday)
  };
}

</script>
