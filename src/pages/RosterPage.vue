<template>
  <q-page padding>
    <div class="row justify-between items-center">
      <q-badge
        :label="$t(schedule.status)"
        rounded
        :color="statusColor[schedule.status]"
        class="q-mb-sm q-px-sm text-subtitle2 text-bold"
      />
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
        class="q-px-sm text-subtitle2 text-bold invisible"
        style="height: 0"
      />
    </div>

    <!-- <q-markup-table
      v-if="false"
      flat
      separator="cell"
      class="shift-table full-width"
      dense
      wrap-cells
    >
      <thead>
        <th>
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
        </th>
        <th
          v-for="(weekday, index) in weekdays"
          :key="index"
          :class="dayClasses(weekday).concat([!isToday(weekday) ? 'text-grey-8' : '']).concat('ellipsis')"
        >
          <div>{{ $d(weekday, "WeekdayLong") }}</div>
          <div class="text-body2 text-weight-bold">{{ $d(weekday, "DayMonthNumeric") }}</div>
        </th>
      </thead>
      <tbody>
        <tr v-if="schedule.shifts.length == 0">
          <td colspan="8">
            <div class="row items-center justify-center q-gutter-xs">
              <div class="text-italic">{{ $t("noShifts") }}</div>
              <q-btn
                v-if="isEditable"
                :label="$t('addItem', [$t('shift')])"
                flat
                rounded
                no-caps
                dense
                color="primary"
                class="q-px-sm text-italic"
                @click="addShift"
              />
            </div>
          </td>
        </tr>
        <tr
          v-for="(shift, index) in schedule.shifts"
          :key="index"
        >
          <td>
            <div class="row items-center q-gutter-xs">
              <div>{{ $t('shift') }}</div>
              <q-btn
                v-if="isEditable"
                icon="fa fa-pen"
                :title="$t('editItem', [$t('shift')])"
                round
                flat
                size="sm"
                style="padding: 13px"
                color="primary"
                @click="editShift(shift)"
              />
            </div>
          </td>
          <td
            v-for="(weekday, index) in weekdays"
            :key="index"
            :class="dayClasses(weekday)"
          >
            <div
              v-if="shift.assignments[index] != undefined"
              class="text-center"
            >•</div>
          </td>
        </tr>
        <tr>
          <td colspan="8"></td>
        </tr>
        <tr
          v-for="(name, index) in workerNames"
          :key="index"
        >
          <td>{{ name }}</td>
          <td
            v-for="(weekday, index) in weekdays"
            :key="index"
            :class="dayClasses(weekday)"
          >
          </td>
        </tr>
      </tbody>
    </q-markup-table> -->


    <q-calendar-scheduler
      ref="calendar"
      view="week"
      :locale="locale"
      :modelValue="toUTC(currentWeekStart).toISOString().substring(0, 10)"
      @update:model-value="gotoDate"
      :model-resources="resources"
      resource-key="value"
      resource-label="label"
      :resource-min-height="44"
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

        <template v-if="resource.type == 'no-shifts'">
          <div class="full-container-width row items-center justify-center q-gutter-x-md q-py-sm">
            <div class="text-weight-medium">
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
        </template>

        <template v-else-if="resource.type == 'shift'">
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
          <q-card
            v-for="(item, index) in getAssignments(scope)"
            :key="index"
            :flat="item.state != 'high'"
            bordered
            :class="[
              'q-ma-xs',
              editableClass, 
              !!item.memberId ? 'bg-primary text-white' : 'text-caption text-italic',
              item.state == 'low' ? '' : 'border-primary text-primary',
              item.state == 'high' ? 'text-bold' : '',
            ]"
          >
            <q-card-section
              class="text-center q-pa-xs"
            >
              {{ item.label }}
            </q-card-section>
            <q-popup-edit
              v-if="isEditable"
              :model-value="item.memberId"
              @update:model-value="setAssignment(scope, index, $event)"
              auto-save
              v-slot="scope"
            >
              <q-select
                v-model="scope.value" 
                :label="$t('teamMember')"
                :options="teamMembers"
                map-options
                emit-value
                :behavior="selectBehavior()"
                options-dense
                hide-bottom-space
                autofocus
                clearable
                style="min-width: 220px"
              />
            </q-popup-edit>
          </q-card>
          <q-card
            v-if="isEditable && isFullyAssigned(scope)"
            flat
            bordered
            class="q-ma-xs bg-transparent row justify-center q-pa-sm cursor-pointer"
          >
            <q-icon
              name="fas fa-add"
              color="primary"
            />
          </q-card>
        </template>

        <template v-else-if="scope.resource.type == 'member'">
          <q-card
            v-for="(item, index) in getAvailability(scope)"
            :key="index"
            :flat="item.state != 'high'"
            bordered
            dense
            color="primary"
            :class="[
              'q-ma-xs q-px-xs radius-md bg-transparent text-center', 
              isEditable ? 'cursor-pointer' : '',
              item.state == 'low' ? '' : 'border-primary text-primary',
              item.state == 'high' ? 'text-bold' : '',
            ]"
            @click="matchAssignment(scope, item.state)"
          >
            {{ item.label }}
          </q-card>
        </template>

      </template>
    </q-calendar-scheduler>
    <!-- <pre>{{ JSON.stringify(schedule.shifts, null, 2) }}</pre> -->

    <div class="row justify-between items-center q-gutter-md q-mt-md">
      <q-btn
        v-if="schedule.status == 'draft' && otherWeeks.length"
        :label="$t('copyPreviousWeek')"
        color="primary"
        outline
        rounded
        no-caps
        @click="selectedRow = null; copyPreviousSchedule()"
      />
      <q-space v-else />

      <q-btn
        v-if="schedule.status == 'draft' && hasOpenShifts"
        :label="$t('offerOpenShifts')"
        :disable="schedule.shifts.length == 0"
        color="primary"
        outline
        rounded
        no-caps
        @click="selectedRow = null; schedule.status = 'collaboration'"
      />
      <q-btn
        v-else-if="['draft', 'collaboration'].includes(schedule.status)"
        :label="$t('approve')"
        :disable="schedule.shifts.length == 0"
        color="primary"
        outline
        rounded
        no-caps
        @click="selectedRow = null; schedule.status = 'approved'"
      />
      <q-btn
        v-else-if="schedule.status == 'approved'"
        :label="$t('discard')"
        color="primary"
        outline
        rounded
        no-caps
        @click="selectedRow = null; schedule.status = 'draft'"
      />
    </div>
  </q-page>
</template>

<style lang="sass">
.selected-week
  min-width: 218px
  @media (min-width: $breakpoint-xs-max)
    min-width: 280px
// .shift-table .q-table
//   // table-layout: fixed
//   tbody tr, tbody tr td
//     height: 44px
//   th
//     font-weight: 700
//     font-size: 1rem
//   th, td
//     min-width: 100px
//     min-height: 44px
//     overflow: hidden
//     @media (max-width: $breakpoint-xs-max)
//       min-width: calc(50vw - 8px)
//   th:first-child
//     padding: 4px !important
//   th:first-child,
//   td:first-child
//     padding-left: 8px
//     position: sticky
//     left: 0
//     z-index: 1
//     background-color: #ffffff
//     min-width: 120px
//     @media (max-width: $breakpoint-xs-max)
//       min-width: calc(50vw - 8px)
//   tbody td
//     font-size: 14px
.roster-scheduler
  container-type: inline-size
  .q-calendar-scheduler__head
    border-bottom: 0px none
    line-height: 16px
  .q-calendar-scheduler__head--day 
    border-bottom: 1px solid rgb(224, 224, 224)
  .q-calendar-scheduler__head--weekday
    padding-top: 6px
  // .q-calendar-scheduler__head--date
  //   height: 24px
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
  // .q-calendar-scheduler__day:not(.no-shifts, .spacer):hover .q-calendar__focus-helper
  //   background-color: currentcolor
  //   opacity: 0.15
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
import { Availability, createAvailability } from "src/models/availability";
import ShiftSheet from "src/components/ShiftSheet.vue";
import SelectDialog from "src/components/SelectDialog.vue";

const $q = useQuasar();
const { t, d } = useI18n();

// – Navigation

const dateProxy: Ref<QPopupProxy | null> = ref(null);
const currentWeekStart = ref(getWeekStart());

// function gotoPreviousWeek() {
//   currentWeekStart.value = date.subtractFromDate(
//     currentWeekStart.value, 
//     { days: 7 }
//   );
// }

// function gotoNextWeek() {
//   currentWeekStart.value = date.addToDate(
//     currentWeekStart.value, 
//     { days: 7 }
//   );
// }

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

// function isToday(value: Date) {
//   return date.isSameDate(value, new Date(), "date")
// }

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
const hasOpenShifts = computed(() => 
  schedule.value.shifts.find(shift => 
    Object.values(shift.assignments).find(list => 
      list.length < shift.minimumWorkers
    ) != undefined
  ) != undefined
);
const otherWeeks = computed(() => 
  roster.value.weeks.filter(week => week.weekStart.getTime() != currentWeekStart.value.getTime()
    && week.shifts.length > 0
));

const positions = ["Tische", "Bar", "Küche"];

type TeamMember = Availability & {
  label: string; 
  positions: string[]; 
  value: string;
};

const teamMembers: Ref<TeamMember[]> = ref([
  {
    label: "Alice", 
    positions: [positions[0]], 
    value: v4(),
    ...available(["08,18", "08,16", "08,18", "", "08,18", "08,16", ""])
  },
  { 
    label: "Bob", 
    positions: [positions[0], positions[1]], 
    value: v4(),
    ...available(["12,24", "", "12,24", "12,24", "", "12,24", "12,24"])
  },
  { 
    label: "Charlie", 
    positions: [positions[2]], 
    value: v4(),
    ...available(["", "06,12", "10,22", "10,22", "", "10,22", "10,22", "", "16,22"])
  },
  { 
    label: "Dave", 
    positions: [positions[1], positions[2]], 
    value: v4(),
    ...available(["06,16", "06,16", "06,16", "", "12,24", "12,24", ""])
  },
  { 
    label: "Eve", 
    positions: [positions[0], positions[2]], 
    value: v4(),
    ...available(["", "11,24", "11,24", "13,02", "", "11,24", "11,24"])
  },
]);

function available(days: string[]) {
  return createAvailability({availabilities: days.flatMap((hours, index) => {
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

// const weekdays = computed(() => 
//   [...Array(7).keys()].map(days => 
//     date.addToDate(currentWeekStart.value, {days})
//   )
// );

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

type Resource = {
  type: "shift" | "no-shifts" | "spacer" | "member";
  label?: string;
  shift?: Shift;
  shiftIndex?: number;
  member?: TeamMember;
}

type QCalendarScope = {
  resource?: Resource;
  days?: {date: string}[];
  cellWidth?: string;
  timestamp?: {weekday: number, current: boolean};
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
  }]).concat(schedule.value.shifts.length == 0 || !isEditable.value 
    ? [] 
    : teamMembers.value.map((member) => ({
        type: "member",
        member
      }))
  )
)

function isFullyAssigned(scope: QCalendarScope) {
  const shift = scope.resource?.shift 
  return !!shift && shift.assignments[scope.timestamp!.weekday]?.filter(Boolean).length >= shift.minimumWorkers;
}

function getAssignments(scope: QCalendarScope) {
  const shift = scope.resource?.shift;
  const assignments = shift?.assignments[scope.timestamp!.weekday];
  const lengthOfEmpty = assignments
    ? Math.max((shift?.minimumWorkers || 0) - assignments.length, 0)
    : 0;

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
    })
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
  const weekday = scope.timestamp?.weekday;

  return scope.resource?.member?.availabilities
    .filter(({ start }) => start.getDay() == weekday)
    .map(({ start, end }) => {
      const label = timeRange(start, end);
      let state = "normal";
      const selectedShift = selectedRow.value !== null
        ? schedule.value.shifts[selectedRow.value]
        : undefined;
      
      if (selectedShift) {
        state = Math.random() < 0.5 ? "high" : "low"
      }

      return {label, state}
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

const editableClass = computed(() => 
  isEditable.value ? "cursor-pointer can-hover" : ""
);

const selectedRow: Ref<number | null> = ref(null);

function onClickResource({ scope }: {scope: QCalendarScope}) {
  if (isEditable.value) {
    if (["shift", "member"].includes(scope.resource?.type || "") 
      && scope.resourceIndex != selectedRow.value) {
        selectedRow.value = scope.resourceIndex ?? null;
    } else {
        selectedRow.value = null;
    }
  }
}

// function dayClasses(date: Date) {
//   const today = isToday(date);
//   return [
//     today ? "text-primary bg-primary-light" : "",
//     !today && [0, 6].includes(date.getDay()) ? "bg-weekend" : ""
//   ];
// }

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
