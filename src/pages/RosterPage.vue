<template>
  <q-page padding>
    <div class="row justify-between items-center q-gutter-xs">
      <q-badge
        :label="$t(schedule.status)"
        rounded
        :color="statusColor[schedule.status]"
        class="q-px-sm text-subtitle2 text-bold"
      />
      <div class="row justify-center items-center no-wrap">
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
                  :modelValue="toUTC(currentWeekStart).toISOString().substring(0, 10)"
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
            <div class="text-h6 line-height-12">{{ $d(currentWeekStart, "MonthYear") }}</div>
            <div class="text-body2 line-height-12">{{ $t("calendarWeekAbbr") }} {{ getWeek(currentWeekStart, 0) }}</div>
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
      <q-badge
        :label="$t(schedule.status)"
        rounded
        :color="statusColor[schedule.status]"
        class="q-px-sm text-subtitle2 text-bold invisible q-py-none q-my-none"
        style="height: 0"
      />
    </div>

    <div class="row justify-center items-center q-gutter-x-md q-mt-sm q-mb-md">
      <q-btn
        v-if="schedule.status == 'draft' && otherWeeks.length"
        icon="fas fa-clone"
        color="primary"
        flat
        round
        no-caps
        dense
        @click="selectedRow = null; copyPreviousSchedule()"
      >
        <q-tooltip
          :offset="$q.platform.is.mobile ? [0,10] : [0,4]"
          :anchor="($q.platform.is.mobile ? 'top middle' : 'bottom middle')"
          :self="($q.platform.is.mobile ? 'bottom middle' : 'top middle')"
          class="text-center"
          style="font-size: 0.8rem"
        >{{ $t('copyPreviousWeek') }}</q-tooltip>
      </q-btn>

      <q-btn
        v-if="schedule.shifts.length > 0"
        :icon="schedule.notify ? 'fas fa-bell' : 'fas fa-bell-slash'"
        color="primary"
        flat
        round
        no-caps
        dense
        @click="selectedRow = null; schedule.notify = !schedule.notify"
      >
        <q-tooltip
          :offset="$q.platform.is.mobile ? [0,10] : [0,4]"
          :anchor="($q.platform.is.mobile ? 'top middle' : 'bottom middle')"
          :self="($q.platform.is.mobile ? 'bottom middle' : 'top middle')"
          class="text-center"
          style="font-size: 0.8rem"
        >{{ !schedule.notify 
            ? $t("activateOpenShiftNotifications") 
            : $t("deactivateOpenShiftNotifications") 
          }}</q-tooltip>
      </q-btn>

      <q-btn
        v-if="schedule.status == 'draft'"
        :label="$t('approve')"
        :disable="schedule.shifts.length == 0"
        color="primary"
        outline
        rounded
        no-caps
        dense
        class="q-px-sm"
        @click="selectedRow = null; schedule.status = 'approved'"
      />
      <q-btn
        v-else-if="schedule.status == 'approved'"
        :label="$t('edit')"
        color="primary"
        outline
        rounded
        no-caps
        dense
        class="q-px-sm"
        @click="selectedRow = null; schedule.status = 'draft'"
      />
    </div>

    <q-calendar-scheduler
      ref="calendar"
      view="week"
      :locale="locale"
      :modelValue="toUTC(currentWeekStart).toISOString().substring(0, 10)"
      @update:model-value="gotoDate"
      :model-resources="resources"
      resource-key="value"
      resource-label="label"
      :resource-min-height="schedule.shifts.length > 0 ? 44 : 0"
      @click-resource="onClickResource"
      :cell-width="$q.screen.gt.xs ? 'max(14.28%, 110px)' : 'calc(50vw - 8px)'"
      :weekday-breakpoints="[200, 100]"
      no-active-date
      animated
      :class="['roster-scheduler', isEditable ? 'editable' : '']"
      :resource-class="weekdayClass"
      :weekday-class="weekdayClass"
      :day-class="weekdayClass"
      @change="selectedRow = null"
    >
      <template #head-resources>
        <div class="column justify-center">
          <q-btn
            v-if="isEditable"
            icon="fa fa-add"
            :label="$t('shift', 2)"
            :title="$t('addItem', [$t('shift')])"
            rounded
            flat
            no-caps
            dense
            size="md"
            color="primary"
            class="q-px-sm"
            @click="addShift"
          />
        </div>
      </template>

      <template #head-day="{ scope: { timestamp } }">
        <div class="q-calendar-scheduler__head--weekday q-calendar__center q-calendar__ellipsis">
          <span class="q-calendar-scheduler__head--weekday-label q-calendar__ellipsis">
            {{ $d(timestamp.date, "WeekdayLong") }}
          </span>
        </div>
        <div class="q-calendar-scheduler__head--date q-calendar__center">
          <button 
            class="q-calendar__button q-calendar__button--round" 
            :aria-label="$d(timestamp.date, 'DateHuge')"
            tabindex="-1"
            
          >{{ $d(timestamp.date, "DayMonthNumeric") }}</button>
        </div>
      </template>

      <template #resource-label="{ scope: { resource, resourceIndex } }">
      
        <template v-if="resource.type == 'shift'">
          <div class="column items-start q-gutter-xs text-black q-pt-xs q-pr-xs non-selectable">
            <q-item-label
              :class="['text-body2 text-weight-bold', selectedRowClass(resourceIndex)]"
            >
              {{ timeRange(resource.shift.startTime, resource.shift.endTime) }}
            </q-item-label>
            <q-item-label
              v-if="resource.shift.position"
              class="text-body2"
            >
              {{ resource.shift.position }}
            </q-item-label>
            <q-item-label
              v-if="resource.shift.notes"
              :lines="2"
              class="text-caption"
            >
              {{ resource.shift.notes }}
            </q-item-label>
            <div>
              <q-btn
                v-if="isEditable"
                icon="fa fa-pen"
                :title="$t('editItem', [$t('shift')])"
                round
                flat
                size="sm"
                style="padding: 11.5px"
                color="primary"
                @click.stop="editShift(resource.shift)"
              />
            </div>
          </div>
        </template>

        <template v-else-if="resource.type == 'spacer'">
          <div class="availabilities-header full-container-width">
            <q-toggle
              v-model="showAvailableMembers"
              :label="$t('availableMembers') + (showAvailableMembers ? ':' : '')"
            />
          </div>
        </template>

        <template v-else-if="resource.type == 'member'">
          <div class="q-py-xs text-black non-selectable">
            <q-item-label 
              :lines="2" 
              :class="['text-body2 text-weight-medium q-mr-xs', selectedRowClass(resourceIndex)]"
            >
              {{ resource.member.label }}
            </q-item-label>
            <q-item-label 
              class="text-caption text-black q-mr-xs"
            >
              {{ resource.member.positions.join(", ") }}
            </q-item-label>
          </div>
        </template>

      </template>

      <template #day="{ scope }">

        <template v-if="scope.resource.type == 'shift'">
          <q-select
            v-for="(item, index) in getAssignments(scope)"
            :key="index"
            :model-value="item.memberId || item.label"
            @update:model-value="setAssignment(scope, index, $event)"
            :options="availableTeamMembers(scope, index)"
            map-options
            emit-value
            :behavior="selectBehavior()"
            dense
            outlined
            :hide-dropdown-icon="item.state == 'additional' || !isEditable"
            :readonly="!isEditable"
            :bg-color="!!item.memberId ? 'primary' : undefined"
            :class="[
              'member-select non-selectable q-mx-xs q-mb-xs',
              index == 0 ? 'q-mt-xs' : '',
              'item-state-' + item.state,
              !!item.memberId ? 'text-white' : '',
              !!item.memberId || (item.state == 'additional') ? '' : 'text-caption text-italic',
            ]"
            menu-anchor="bottom middle"
            menu-self="top middle"
          >
            <template v-slot:option="optionScope">
              <q-item
                v-if="optionScope.opt.headerLabel"
                dense
                class="sticky-option-header"
              >{{ optionScope.opt.headerLabel }}:</q-item>
              <q-item
                v-else
                v-bind="optionScope.itemProps" 
                class="q-pa-xs member-select-item"
                @click="optionScope.opt.value == item.memberId && setAssignment(scope, index, null)"
              >
                <div class="row full-width items-center justify-between">
                  <div class="col q-px-xs">
                    <q-item-label>{{ optionScope.opt.label }}</q-item-label>
                    <q-item-label 
                      v-if="optionScope.opt.caption" 
                      caption
                    >{{ optionScope.opt.caption }}</q-item-label>
                  </div>
                  <q-checkbox
                    v-if="!optionScope.opt.disable"
                    :model-value="optionScope.opt.value == item.memberId"
                    @update:model-value="setAssignment(scope, index, $event ? optionScope.opt.value : null)"
                    size="sm"
                    color="primary"
                    v-close-popup
                  />
                </div>
              </q-item>
            </template>
            <template v-slot:no-option>
              <div
                class="q-px-sm q-py-xs text-caption text-italic"
              >{{ $t("noMemberAvailable") }}</div>
            </template>
          </q-select>
        </template>

        <template v-else-if="scope.resource.type == 'member'">
          <q-card
            v-for="(item, index) in getAvailability(scope)"
            :key="index"
            :flat="item.state != 'high'"
            :bordered="item.state == 'high'"
            dense
            :class="[
              'q-ma-xs q-px-xs radius-md bg-transparent text-center', 
              isEditable ? 'cursor-pointer' : '',
              item.assigned ? 'text-strike' : '',
              item.state == 'low' ? '' : 'border-primary',
              item.state == 'high' && !item.assigned ? 'text-bold text-primary' : '',
            ]"
            @click="matchAssignment(scope, item.state)"
          >
            {{ item.label }}
          </q-card>
        </template>

      </template>
    </q-calendar-scheduler>

    <div 
      v-if="schedule.shifts.length == 0"
      class="row items-center justify-center q-gutter-x-md q-py-sm"
    >
      <div
        class="text-weight-medium"
        style="color: var(--calendar-color)"
      >
        <q-icon
          name="warning"
          size="1.25rem"
          style="padding-bottom: 2px"
        />
        {{ $t("noShifts") }}:
      </div>
      <q-btn
        v-if="isEditable"
        :label="$t('addItem', [$t('shift')])"
        unelevated
        rounded
        no-caps
        dense
        color="primary-gradient"
        class="q-px-md"
        @click="addShift"
      />
    </div>

  </q-page>
</template>

<style lang="sass">
.selected-week
  min-width: 218px
  @media (min-width: $breakpoint-xs-max)
    min-width: 280px
.roster-scheduler
  container-type: inline-size
  .q-calendar-scheduler__head
    border-bottom: 0px none
    line-height: 16px
  .q-calendar-scheduler__head--day 
    border-bottom: 1px solid rgb(224, 224, 224)
  .q-calendar-scheduler__head--weekday
    padding-top: 6px
  .q-calendar-scheduler__head--resources, .q-calendar-scheduler__resource
    min-width: max(12.5%, 110px)
    @media (max-width: $breakpoint-xs-max)
      min-width: calc(50vw - 8px)
  .q-calendar-scheduler__head--resources
    border-bottom: 1px solid rgb(224, 224, 224)
  .q-calendar-scheduler__resource
    border-top: 1px solid rgb(224, 224, 224)
  .q-calendar-scheduler__resource--days
    overflow: visible
  .q-calendar-scheduler__resource--row
    border-top: 0px none
  .q-calendar-scheduler__day
    flex-basis: 100%
    min-width: max(14.28%, 110px)
    @media (max-width: $breakpoint-xs-max)
      min-width: calc(50vw - 8px)
    border-top: 1px solid rgb(224, 224, 224)
  .no-shifts, .spacer
    background-color: #ffffff !important
    border-right: 0px none
    .q-calendar__ellipsis
      overflow: unset
  .full-container-width
    width: 400px
    max-width: calc(100vw - 16px)
    width: 100cqw
  .q-calendar-scheduler__scroll-area
    scroll-snap-type: x mandatory
  .q-calendar-scheduler__head--resources, .q-calendar-scheduler__head--day
    scroll-snap-align: start
  &.editable
    .q-calendar-scheduler__resource:not(.no-shifts, .spacer)
      cursor: pointer
  .q-card
    transition-property: box-shadow, color, border-color
    transition-duration: .25s
    transition-timing-function: ease-in-out
  .member-select
    transition-property: box-shadow
    transition-duration: .25s
    transition-timing-function: ease-in-out
    .q-field__append
      padding-left: 0
    .q-field__control
      padding-left: 4px
      padding-right: 0
    .q-field__native
      justify-content: center
    .q-field__control::before
      transition-property: border-color
      transition-duration: .25s
      transition-timing-function: ease-in-out
    .q-field__native, .q-field__append
      transition-property: color
      transition-duration: .25s
      transition-timing-function: ease-in-out
    &.text-white
      .q-field__native, .q-field__append
        color: #ffffff
    &.item-state-normal, &.item-state-high, &.text-white
      .q-field__control::before
        border-color: var(--q-primary)
    &.item-state-normal:not(.text-white), &.item-state-high:not(.text-white)
      .q-field__native, .q-field__append
        color: var(--q-primary)
    &.item-state-high
      box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 5px, rgba(0, 0, 0, 0.14) 0px 2px 2px, rgba(0, 0, 0, 0.12) 0px 3px 1px -2px
      .q-field__native
        font-weight: bold
    &.item-state-additional
      .q-field__control
        padding-left: 0
        min-height: 32px
        &:hover::before
          border-color: var(--q-primary)
      .q-field__native
        min-height: 0
        font-size: 1.4rem
        color: var(--q-primary)
  .availabilities-header
    padding-top: .5rem
    font-size: 1rem
    font-weight: bold
.member-select-item
  .q-item__label + .q-item__label
    margin-top: 2px
.sticky-option-header
  position: -webkit-sticky
  position: sticky
  background-color: #ffffff
  top: 0px
  z-index: 1
  text-align: center
  overflow: hidden
  min-height: initial
  min-width: 140px
  padding: 8px 0 4px
  display: flex
  flex-direction: row
  font-weight: bold
  &:before, &:after
    content: ""
    flex: 1 1
    margin: auto
  &:before
    margin-right: .5em
  &:after
    margin-left: .5em
  &:not(:first-child)
    font-weight: normal
    &:before, &:after
      border-bottom: 2px solid #cccccc
</style>

<script setup lang="ts">
import { Ref, computed, ref, toRaw } from "vue";
import { useI18n } from "vue-i18n";
import { QPopupProxy, date, useQuasar } from "quasar";
import { QCalendarScheduler } from "@quasar/quasar-ui-qcalendar";
import { v4 } from "uuid";
import { locale } from "src/boot/i18n";
import { selectBehavior } from "src/helper/utils";
import { getWeek, toUTC } from "src/helper/date";
import { showWarning } from "src/helper/warning";
import { Shift, WeekSchedule, createRoster, createWorkSchedule } from "src/models/roster";
import { Availability, AvailabilityList, createAvailabilityList } from "src/models/availability";
import ShiftSheet from "src/components/ShiftSheet.vue";
import SelectDialog from "src/components/SelectDialog.vue";

const $q = useQuasar();
const { t, d } = useI18n();

// – Navigation

const dateProxy: Ref<QPopupProxy | null> = ref(null);
const currentWeekStart = ref(getWeekStart());

function gotoDate(value: string | null) {
  if (value) {
    currentWeekStart.value = getWeekStart(new Date(value));
  }
  
  dateProxy.value?.hide();
}

function getWeekStart(value = new Date()) {
  return date.startOfDate(
    date.subtractFromDate(value, { days: value.getDay()}),
    "day"
  )
}

const statusColor = {
  "draft": "secondary",
  "collaboration": "extra",
  "approved": "ternary",
  "discarded": "primary",
}

// - Roster

const roster = ref(createRoster());

const existingSchedule = computed((): WeekSchedule | null => 
  roster.value.weeks.find(week => 
    date.isSameDate(week.weekStart, currentWeekStart.value, "date")
  ) || null
)
const schedule = computed((): WeekSchedule => 
  existingSchedule.value || createWorkSchedule(currentWeekStart.value)
);
const isEditable = computed(() => ["draft", "collaboration"].includes(schedule.value.status));
const otherWeeks = computed(() => 
  roster.value.weeks.filter(week => week.weekStart.getTime() != currentWeekStart.value.getTime()
    && week.shifts.length > 0
));

const positions = ["Tische", "Bar", "Küche"];

type TeamMember = AvailabilityList & {
  label: string; 
  value: string;
  positions: string[];
};

const teamMembers: Ref<TeamMember[]> = ref([
  {
    label: "Alice Adams", 
    positions: [positions[0]], 
    value: v4(),
    ...available(["08,18", "08,16", "08,18", "", "08,18", "08,16", ""])
  },
  { 
    label: "Bob Brown", 
    positions: [positions[0], positions[1]], 
    value: v4(),
    ...available(["12,23", "", "12,23", "12,23", "", "12,23", "12,23"])
  },
  { 
    label: "Charlie Clark", 
    positions: [positions[2]], 
    value: v4(),
    ...available(["", "06,12", "10,22", "10,22", "", "10,22", "10,22", "", "16,22"])
  },
  { 
    label: "Dave Diaz", 
    positions: [positions[1], positions[2]], 
    value: v4(),
    ...available(["06,16", "06,16", "06,16", "", "12,24", "12,24", ""])
  },
  { 
    label: "Eve Evans", 
    positions: [positions[0], positions[2]], 
    value: v4(),
    ...available(["", "11,24", "11,24", "13,02", "", "11,24", "11,24"])
  },
]);

function available(days: string[]) {
  return createAvailabilityList({availabilities: days.flatMap((hours, index) => {
    if (hours) {
      const [start, end] = hours.split(",");
      return [{
        start: new Date(`2023-10-0${index + 1}T${start}:00:00.000`),
        end: new Date(`2023-10-0${index + 1}T${end}:00:00.000`),
      }]
    } else {
      return [];
    }
  })})
}

function addShift() {
  selectedRow.value = null;

  $q.dialog({
    component: ShiftSheet,
    componentProps: { positions }
  })
  .onOk((shift: Shift) => {
    if (!existingSchedule.value) {
      roster.value.weeks.unshift(schedule.value);
    }

    schedule.value.shifts.push(shift);
  });
}

function editShift(shift: Shift) {
  selectedRow.value = null;
  
  $q.dialog({
    component: ShiftSheet,
    componentProps: { modelValue: toRaw(shift), positions }
  })
  .onOk((newValue?: Shift) => {
    const index = schedule.value.shifts.indexOf(shift);

    if (index >= 0) {
      if (newValue) {
        schedule.value.shifts[index] = newValue;
      } else {
        schedule.value.shifts.splice(index, 1)
      }
    }
  });
}

// - Scheduler

const calendar: Ref<QCalendarScheduler | null> = ref(null);
const showAvailableMembers = ref(false);

type Resource = {
  type: "shift" | "no-shifts" | "spacer" | "member";
  label?: string;
  shift?: Shift;
  shiftIndex?: number;
  member?: TeamMember;
}

type QCalendarTimestamp = {
  weekday: number;
  current: boolean;
  day: number;
  month: number;
  year: number;
};

type QCalendarScope = {
  resource?: Resource;
  days?: {date: string}[];
  cellWidth?: string;
  timestamp?: QCalendarTimestamp;
  resourceIndex?: number;
};

const resources = computed(() => 
  schedule.value.shifts.map((shift, index) => ({
    type: "shift",
    shift,
    shiftIndex: index
  } as Resource)).concat(schedule.value.shifts.length > 0 ? [] : [{
    type: "no-shifts",
  }]).concat(schedule.value.shifts.length == 0 || !isEditable.value ? [] : [{
    type: "spacer",
  }]).concat(schedule.value.shifts.length == 0 || !isEditable.value || !showAvailableMembers.value
    ? [] 
    : teamMembers.value.map((member) => ({
        type: "member",
        member
      }))
  )
)

function getAssignments(scope: QCalendarScope) {
  const shift = scope.resource?.shift;
  const assignments = shift?.assignments[scope.timestamp!.weekday];
  const lengthOfEmpty = assignments
    ? Math.max((shift?.minimumWorkers || 0) - assignments.length, 0)
    : 0;
  const isFullyAssigned = !!shift && !!assignments 
    && assignments.filter(Boolean).length >= shift.minimumWorkers;

  return (assignments || []).concat(Array(lengthOfEmpty).fill(""))
    .map(memberId => {
      const label = getMember(memberId)?.label || t("notAssigned");
      let state = "normal";
      const selectedMember = selectedRow.value !== null
        ? teamMembers.value[selectedRow.value - schedule.value.shifts.length - 1]
        : undefined;
          
      if (selectedMember) {
        state = Math.random() < 0.5 ? "high" : "low"
      }

      return { memberId, label, state };
    }).concat(isFullyAssigned && isEditable.value ? [{
      memberId: "",
      label: "+",
      state: "additional",
    }] : [])
}

function setAssignment(scope: QCalendarScope, index: number, value: string | null) {
  const shiftIndex = scope.resource?.shiftIndex;
  const weekday = scope.timestamp?.weekday;

  if (shiftIndex != undefined && weekday != undefined) {
    const assignments = schedule.value.shifts[shiftIndex].assignments[weekday];

    if (value) {
      assignments.splice(index, 1, value);
    } else {
      assignments.splice(index, 1);
    }
  }
}

function matchAssignment(scope: QCalendarScope, state: string) {
  if (state == "high") {
    const weekday = scope.timestamp?.weekday;
    const member = scope.resource?.member;

    if (!!member && selectedRow.value !== null && weekday) {
      const assignments = schedule.value.shifts[selectedRow.value]?.assignments[weekday];
      assignments.push(member.value);
    }
  }
}

function getMember(id?: string) {
  return teamMembers.value.find(member => member.value == id);
}

function getAvailability(scope: QCalendarScope) {
  const timestamp = scope.timestamp!;
  const weekday = timestamp.weekday;
  const member = scope.resource!.member!;

  return member.availabilities
    .filter(({ start }) => start.getDay() == weekday)
    .map(item => {
      const label = timeRange(item.start, item.end);
      let state = "normal";
      const assigned = schedule.value.shifts.find(shift => 
        shift.assignments[weekday]?.includes(member.value) 
          && matchShiftAvailability(shift, item, timestamp)
      ) != undefined;
      const selectedShift = selectedRow.value !== null
        ? schedule.value.shifts[selectedRow.value]
        : undefined;
      
      if (selectedShift) {
        state = Math.random() < 0.5 ? "high" : "low"
      }

      return {label, state, assigned}
    })
}

function timeRange(start: Date, end: Date) {
  return d(start, "Time24Simple") + " – " + d(end, "Time24Simple");
}

function weekdayClass(data: {scope: QCalendarScope}) {
  const timestamp = data.scope.timestamp;
  const isToday = !!timestamp?.current;
  const isSelectedRow = data.scope.resourceIndex === selectedRow.value;
  const type = data.scope.resource?.type || "";
  const typeClass: any = {};
  typeClass[type] = !!type;

  return {
    "bg-secondary-light": isSelectedRow,
    "bg-primary-light": !isSelectedRow && isToday,
    "bg-weekend": !isSelectedRow && !isToday 
      && !!timestamp && [0, 6].includes(timestamp?.weekday),
    ...typeClass
  };
}

function selectedRowClass(resourceIndex: number) {
  return resourceIndex === selectedRow.value
    ? "text-primary"
    : "";
}

const selectedRow: Ref<number | null> = ref(null);

function onClickResource({ scope, event }: {scope: QCalendarScope, event: Event}) {
  if (isEditable.value && !(event instanceof KeyboardEvent)) {
    if (["shift", "member"].includes(scope.resource?.type || "") 
      && scope.resourceIndex != selectedRow.value) {
        selectedRow.value = scope.resourceIndex ?? null;
    } else {
        selectedRow.value = null;
    }
  }
}

function availableTeamMembers(scope: QCalendarScope, index: number) {
  const timestamp = scope.timestamp!;
  const weekday = timestamp.weekday;
  const shift = scope.resource!.shift!;

  // idea: this potentially intense calculation happens in advance for every visible QSelect
  // and might be optimized by calculating the options lazily on-demand (@filter)
  const options = teamMembers.value
    .map(member => {
      const availabilities = member.availabilities
        .filter(item => matchShiftAvailability(shift, item, timestamp));
      const isAssigned = schedule.value.shifts.find(shift2 => 
          // ToDo: assignment could end on the following day:
          // ToDo: check start and end time of shift:
          shift2.assignments[weekday]?.includes(member.value)
            && (shift != shift2 || shift2.assignments[weekday]?.[index] != member.value)
        ) != undefined
      const available =
        // 1. member has matching availability
        availabilities.length > 0
        // 2. member is not absent
        // ToDo: filter absence (full day / half day)
        // 3. member is not assigned or is assigned to this shift and slot (index)
        && !isAssigned
        // 4. member matches position if shift requires position
        // ToDo: filter position
      // ToDo: enable current user, even if his availability is not matched, except when absent or assigned
      const disable = !available;
      const caption = isAssigned
        ? t("alreadyAssigned")
        : member.availabilities
          .filter(({ start }) => start.getDay() == weekday)
          .map(({start, end}) => timeRange(start, end))
          .join(", ") || t("noAvailability");
      const sortIndex = isAssigned 
        ? 1
        : availabilities.length == 0
          ? 2
          : 0

      return {
        ...member,
        caption,
        available,
        disable,
        sortIndex
      }
    });

    const available = options.filter(item => item.available);
    const unavailable = options.filter(item => !item.available)
      .sort((a, b) => a.sortIndex - b.sortIndex);

    return available
      .concat(unavailable.length > 0 ? [{headerLabel: t("notAvailable")}] : [])
      .concat(unavailable)

}

function matchShiftAvailability(shift: Shift, availability: Availability, timestamp: QCalendarTimestamp) {
  return availability.start.getDay() == timestamp.weekday
    && compareTime(availability.start, shift.startTime, timestamp) <= 0
    // ToDo: shift and availability could end on the following day:
    && compareTime(availability.end, shift.endTime, timestamp) >= 0
}

/** negative if a < b, zero if a == b, positive if  > b */
function compareTime(a: Date, b: Date, timestamp: QCalendarTimestamp) {
  return mergeDate(timestamp, a).getTime() - mergeDate(timestamp, b).getTime();
}

function mergeDate(timestamp: QCalendarTimestamp, time: Date) {
  return new Date(
    timestamp.year, timestamp.month - 1, timestamp.day, 
    time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()
  );
}

// - Actions

function copyPreviousSchedule() {
  if (!!existingSchedule.value) {
    showWarning(
      t("overwriteScheduleWarningMessage", [getWeek(currentWeekStart.value, 0)]), 
      t("overwriteScheduleWarningTitle")
    )
    .onOk(() => copyRosterDialog())
  } else {
    copyRosterDialog();
  }
}

function copyRosterDialog() {
  $q.dialog({
    component: SelectDialog,
    componentProps: {
      title: t("copyRosterDialogTitle"),
      message: t("copyRosterDialogMessage"),
      selectOptions: otherWeeks.value.map(week => ({
        label: t("calendarWeekAbbr") + " " + getWeek(week.weekStart, 0) + ": "
          + d(week.weekStart, "DateShort") + " – "
          + d(date.addToDate(week.weekStart, {days: 6}), "DateShort"),
        value: week
      })),
      otherButtonLabels: [t("copyRosterWithoutAssignmentsButton")],
      okButtonLabel: t("copyRosterWithAssignmentsButton"),
    }
  })
  .onOk(({selection, buttonIndex}: {selection: WeekSchedule, buttonIndex: number}) => {
    const newWeek = structuredClone(toRaw(selection));
    const weekStart = currentWeekStart.value.getTime();
    newWeek.weekStart = new Date(weekStart);
    newWeek.status = "draft";
    newWeek.notify = false;

    if (buttonIndex == 0) {
      newWeek.shifts.forEach(shift => 
        Object.keys(shift.assignments).forEach((day: any) => 
          shift.assignments[day] = []
        )
      );
    }

    const weekIndex = roster.value.weeks.findIndex(week => 
      week.weekStart.getTime() == weekStart
    );

    if (weekIndex < 0) {
      roster.value.weeks.unshift(newWeek);
    } else {
      roster.value.weeks.splice(weekIndex, 1, newWeek);
    }
  });
}

</script>
