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
    <q-select
      v-model="absenteeId"
      :label="$t('teamMember')"
      :options="teamMembers"
      map-options
      emit-value
      :behavior="selectBehavior()"
      options-dense
      hide-bottom-space
    />
    <selectable-input
      v-model="absence.reason"
      :label="$t('absenceReason')"
      :options="reasonOptions"
      clearable
      hide-dropdown-icon
      class="q-mb-md"
    />
    <div class="row justify-start q-col-gutter-x-md q-mb-sm">
      <div class="row items-end q-gutter-x-sm">
        <date-time-input
          :modelValue="fromUTC(absence.start)"
          @update:model-value="updateStart"
          :label="$t('startTime')"
          :format="$t('dateFormat')"
          required
          color="primary"
          style="width: 140px"
        />
        <q-select
          :modelValue="absence.start.toISOString().substring(11,19)"
          @update:model-value="updatePartialStart"
          :options="getPartialSelectOptions('00:00:00')"
          map-options
          emit-value
          :behavior="selectBehavior()"
          dense
          options-dense
          hide-bottom-space
          style="width: 128px"
        />
      </div>
      <div class="row items-end q-gutter-x-sm">
        <date-time-input
          :modelValue="fromUTC(absence.end)"
          @update:model-value="updateEnd"
          :label="$t('endTime')"
          :format="$t('dateFormat')"
          required
          color="primary"
          style="width: 140px"
        />
        <q-select
          :modelValue="absence.end.toISOString().substring(11,19)"
          @update:model-value="updatePartialEnd"
          :options="getPartialSelectOptions('23:59:59')"
          map-options
          emit-value
          :behavior="selectBehavior()"
          dense
          options-dense
          hide-bottom-space
          style="width: 128px"
        />
      </div>
    </div>
    <div class="text-caption q-mb-md">
      {{ duration }} {{ $t("day", duration) }} 
      {{ tv(absence.reason) }}
    </div>
    <q-input
      v-model="absence.comment"
      :label="$t('comment')"
      autogrow
      class="q-mb-md"
    />
    <q-btn
      v-if="!isNew"
      :label="$t('deleteItem', [$t('absence')])"
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
import { tv } from "src/boot/i18n";
import { useDialogPluginComponent } from "quasar";
import { selectBehavior } from "src/helper/utils";
import { fromUTC, toUTC } from "src/helper/date";
import { equals } from "src/models/base";
import { Absence, createAbsence } from "src/models/absence";
import { createOrganization } from "src/models/organization";
import EditingSheet from "src/components/EditingSheet.vue";
import SelectableInput from "src/components/SelectableInput.vue";
import DateTimeInput from "src/components/DateTimeInput.vue";

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object as PropType<Absence>
  },
  userId: {
    type: String,
    required: true,
  },
  teamMembers: {
    type: Array as PropType<{label: string, value: string}[]>,
    default: () => []
  },
  isNew: Boolean,
});

const organization = ref(createOrganization());
const reasonOptions = computed(() => 
  organization.value.selectionOptions.absenceReasons
    .map(reason => ({ label: tv(reason.title), value: reason.title }))
);

const absence: Ref<Absence> = ref(
  structuredClone(props.modelValue)
    || createAbsence({
      reason: reasonOptions.value.at(0)?.value || "",
    })
);
const absenteeId = ref(props.userId || props.teamMembers.at(0)?.value || "");

const duration = computed(() =>
  Math.round(
    (absence.value.end.getTime() - absence.value.start.getTime()) 
    / (12 * 3_600_000)
  )
  / 2
)

function updateStart(value: Date) {
  absence.value.start = new Date(
    toUTC(value).toISOString().substring(0, 10) 
      + absence.value.start.toISOString().substring(10)
  );

  if (absence.value.end < absence.value.start) {
    updateEnd(value);
  }
}

function updateEnd(value: Date) {
  absence.value.end = new Date(
    toUTC(value).toISOString().substring(0, 10) 
      + absence.value.end.toISOString().substring(10)
  );

  if (absence.value.end < absence.value.start) {
    updateStart(value);
  }
}

function updatePartialStart(value: string) {
  absence.value.start = new Date(
    absence.value.start.toISOString().substring(0, 11) + value + "Z"
  );
}

function updatePartialEnd(value: string) {
  absence.value.end = new Date(
    absence.value.end.toISOString().substring(0, 11) + value + "Z"
  );
}

function getPartialSelectOptions(fullDayValue: string) {
  return [
    {label: t("fullDay"), value: fullDayValue}, 
    {label: t("noon"), value: "12:00:00"}
  ];
}

const isNew = computed(() => props.modelValue == undefined);
const title = computed(() => t(isNew.value ? "addItem" : "editItem", [t("absence")]));

function hasPendingChanges() {
  return (!!props.modelValue && !equals(props.modelValue, absence.value))
    || (!props.isNew && props.userId != absenteeId.value);
}

function onDone() {
  (dialogRef.value as unknown as EditingSheet)?.confirm();
  emit("ok", {absence: absence.value, userId: absenteeId.value});
}

function onDelete() {
  (dialogRef.value as unknown as EditingSheet)?.confirm();
  emit("ok", {absence: undefined, userId: absenteeId.value});
}

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();

</script>