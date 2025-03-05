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
          <q-btn
            :color="colorForAbsenceReason(event.absence.reason)"
            @click="editAbsence(event.absence, event.userId)"
            no-caps
            rounded
            :style="event.style"
            :class="['absence-event q-pa-none'].concat(event.classes)"
            :id="event.id"
          >
            <text-with-tooltip
              :text="event.label"
              :tooltip="[event.label, event.absence.comment].filter(Boolean).join(' – ')"
              :target="'#' + event.id"
              width="200px"
              :icon-class="!event.absence.comment ? 'hidden' : ''"
              top
              class="full-width text-weight-medium ellipsis q-px-sm cursor-pointer"
            />
          </q-btn>
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
  top: 8px
  height: 28px
  min-height: auto
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
import { locale } from "src/boot/i18n";
import { getOrganization, useDocument } from "src/api/repo";
import { useAccountStore } from "src/stores/accountStore";
import { toUTC } from "src/helper/date";
import { Contact, getName } from "src/models/contact";
import { Absence, AbsenceList } from "src/models/absence";
import { colorForAbsenceReason } from "src/models/organization";
import AbsenceSheet from "src/components/AbsenceSheet.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import { v4 } from "uuid";

const $q = useQuasar();
const { t } = useI18n();
const accountStore = useAccountStore();

// – Data

const authTeam = getOrganization();
const memberHandles = computed(() => {
  // console.log(teamHandle.doc.value?.members, team?.members());
  return Object.entries(accountStore.organization?.members || {})
    .map(([userId, member]) => ({
      userId,
      user: authTeam?.members(userId),
      contact: useDocument<Contact>(member.contactId),
      absences: useDocument<AbsenceList>(member.absencesId),
    }))
});
const members = computed(() => memberHandles.value
  .map(member => ({
    label: getName(member.contact.doc.value, member.user?.userName || member.userId),
    value: member.userId,
  }))
  // ToDo: remove dummy data
  .concat([
    {
      label: "Alice Adams", 
      value: v4(),
    },
    { 
      label: "Bob Brown", 
      value: v4(),
    },
    { 
      label: "Charlie Clark", 
      value: v4(),
    },
    { 
      label: "Dave Diaz", 
      value: v4(),
    },
    { 
      label: "Eve Evans", 
      value: v4(),
    },
  ])
  .sort((a, b) => {
    // the current user's account first, then alphabetical
    if (a.value == accountStore.userId) {
      return -1;
    } else if (b.value == accountStore.userId) {
      return 1;
    } else {
      return a.label.localeCompare(b.label);
    }
  })
);

onUnmounted(() => {
  memberHandles.value.forEach(member => {
    member.contact.cleanup();
    member.absences.cleanup();
  })
})

function addAbsence() {
  $q.dialog({
    component: AbsenceSheet,
    componentProps: {
      userId: accountStore.userId,
      teamMembers: members.value,
      isNew: true
    }
  })
  .onOk(({absence, userId}: {absence: Absence, userId: string}) => {
    const member = memberHandles.value.find(member => userId == member.userId);

    if (userId && member) {
      member.absences.changeDoc(doc => doc.absences.push(absence));
    }
  });
}

function editAbsence(absence: Absence, userId: string) {
  $q.dialog({
    component: AbsenceSheet,
    componentProps: {
      modelValue: toRaw(absence),
      userId,
      teamMembers: members.value,
      isNew: false
    }
  })
  .onOk(({absence: newAbsence, userId: newUserId}: {absence?: Absence, userId: string}) => {
    const member = memberHandles.value.find(member => userId == member.userId);
    const index = member?.absences.doc.value?.absences.indexOf(absence) ?? -1;

    // ensure that original user still exists with original absence
    if (index >= 0) {
      // 1. absence was maybe edited, but refers still to the same user
      if (newAbsence && userId == newUserId) {
        member?.absences.changeDoc(doc => doc.absences[index] = newAbsence);
      // 2. absence was either deleted or moved to a different user
      } else {
        member?.absences.changeDoc(doc => doc.absences.splice(index, 1));
      }

      // 3. absence was maybe edited and moved to a different user
      if (newAbsence && userId != newUserId) {
        const newMember = memberHandles.value.find(member => newUserId == member.userId);

        if (newUserId && newMember) {
          newMember.absences.changeDoc(doc => doc.absences.push(newAbsence));
        }
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
  const userId = scope.resource.value;

  return memberHandles.value
    .find(member => member.userId == userId)
    ?.absences.doc.value?.absences
    .filter(absence =>
      absence.start.getTime() <= end && absence.end.getTime() >= start
    )
    .map((absence, index) => ({
      id: `absence-${userId}-${index}`,
      absence,
      userId,
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
