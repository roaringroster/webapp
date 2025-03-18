<template>
  <editing-sheet
    ref="dialogRef"
    :title="title"
    :hasPendingChanges="hasPendingChanges"
    @ok="onDone"
    @hide="emit('hide')"
    hasDoneButton
    :doneButtonDisable="!isNew && !hasPendingChanges()"
    is-data-available
    :maxWidth="600"
  >
    <div class="row q-gutter-x-md q-mb-md">
      <date-time-input
        v-model="shift.startTime"
        :label="$t('startTime')"
        :format="$t('timeFormat')"
        required
        color="primary"
        style="width: 120px"
      />
      <date-time-input
        v-model="shift.endTime"
        :label="$t('endTime')"
        :format="$t('timeFormat')"
        required
        color="primary"
        style="width: 120px"
      />
      <div class="text-caption text-grey-8 column justify-end no-wrap line-height-11" style="min-height: 56px">
        <div>{{ $t("duration") }}: {{ duration(shiftDuration(shift), locale, "short") }}</div>
        <div v-if="shiftEndsNextDay(shift)">{{ $t("endOnFollowingDay") }}</div>
      </div>
    </div>
    <div class="q-mb-md">
      <div class="text-caption text-grey-8 q-mb-xs">{{ $t('weekdayRecurrence') }} {{ formattedWeekdays }}:</div>
      <q-btn-group
        rounded
        outline
        spread
      >
        <q-btn
          v-for="{label, value} in weekdayOptions"
          :key="value"
          :label="label"
          color="primary"
          no-caps
          :outline="!weekdays.includes(value)"
          @click="toggleWeekday(value)"
        />
      </q-btn-group>
    </div>
    <div class="row q-gutter-md">
      <selectable-input
        v-model="shift.position"
        :label="$t('shiftPosition')"
        :options="positionOptions"
        hide-dropdown-icon
        class="col"
      />
      <div class="col" style="max-width: 200px">
        <div 
          class="q-field__label ellipsis" 
          style="font-size: .75rem; margin: 6px 0 -6px; height: 16px"
        >{{$t('minimumNumberWorkers')}}</div>
        <q-input
          :modelValue="shift.minimumWorkers"
          @update:model-value="shift.minimumWorkers = Math.abs(alwaysInt($event, shift.minimumWorkers))"
          inputmode="numeric"
          pattern="[0-9]"
          maxlength="4"
          color="primary"
          input-class="text-center"
          dense
        >
          <template v-slot:prepend>
            <q-btn
              icon="fas fa-minus"
              flat
              round
              dense
              color="primary"
              @click="shift.minimumWorkers = Math.max(shift.minimumWorkers - 1, 0)"
            />
          </template>
          <template v-slot:append>
            <q-btn
              icon="fas fa-plus"
              flat
              round
              dense
              color="primary"
              @click="shift.minimumWorkers = Math.min(shift.minimumWorkers + 1, 9999)"
            />
          </template>
        </q-input>
      </div>
    </div>
    <q-input
      v-model="shift.notes"
      :label="$t('notes')"
      autogrow
      class="q-mb-md"
    />
    <q-btn
      v-if="!isNew"
      :label="$t('deleteItem', [$t('shift')])"
      icon="fas fa-trash"
      flat
      rounded
      no-caps
      dense
      color="primary"
      class="q-px-sm"
      @click="onDelete"
    />
  </editing-sheet>
</template>

<script setup lang="ts">
import { computed, PropType, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar, date, useDialogPluginComponent } from "quasar";
import { locale } from "src/boot/i18n";
import { createShift, Shift, shiftDuration, shiftEndsNextDay } from "src/models/roster";
import { equals } from "src/models/base";
import { duration } from "src/helper/relativeTime";
import { alwaysInt } from "src/helper/input";
import EditingSheet from "src/components/EditingSheet.vue";
import DateTimeInput from "src/components/DateTimeInput.vue";
import SelectableInput from "src/components/SelectableInput.vue";

const $q = useQuasar();
const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object as PropType<Shift>
  },
  positions: {
    type: Array as PropType<string[]>,
    default: () => []
  }
});

const shift: Ref<Shift> = ref(structuredClone(props.modelValue) || createShift());

const isNew = computed(() => props.modelValue == undefined);
const title = computed(() => t(isNew.value ? "addItem" : "editItem", [t("shift")]));

const weekdays = computed(() => Object.keys(shift.value.assignments).map(parseFloat));

const weekdayOptions = computed(() => 
  [...Array(7).keys()].map(value => ({
    label: date.formatDate(
      new Date(Date.UTC(2021, 5, value - 1)),
      $q.screen.gt.xs ? "dddd" : "ddd"
    ),
    value
  }))
);

const formattedWeekdays = computed(() => 
  weekdays.value
    .map(value => date.formatDate(new Date(Date.UTC(2021, 5, value - 1)), "dddd"))
    .join(", ")
);

function toggleWeekday(value: number) {
  if (shift.value.assignments[value] == undefined) {
    shift.value.assignments[value] = [];
  } else {
    delete shift.value.assignments[value];
  }
}

const positionOptions = computed(() => 
  props.positions.map(label => ({label, value: label}))
);

function hasPendingChanges() {
  return !!props.modelValue && !equals(props.modelValue, shift.value);
}

function onDone() {
  (dialogRef.value as unknown as EditingSheet)?.confirm();
  emit("ok", shift.value);
}

function onDelete() {
  (dialogRef.value as unknown as EditingSheet)?.confirm();
  emit("ok", undefined);
}

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();

</script>