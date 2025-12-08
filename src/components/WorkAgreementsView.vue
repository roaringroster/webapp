<template>
  <div
    v-if="modelValue" 
    ref="el"
  >
    <q-resize-observer @resize="onResize" />
    <div class="readable-line-length">
      <div class="row justify-end">
        <edit-toggle-button
          v-if="!isDisabled"
          v-model="isEditing"
          :class="[$q.screen.gt.xs ? '' : 'q-mr-sm']"
        />
      </div>

      <div v-if="!isEditing || isDisabled">
        <q-list class="text-size-adjust-md q-mb-md">
          <no-data-item
            v-if="!items.length"
            button-classes="text-weight-regular"
            :hide-button="isDisabled"
            class="justify-center"
            @click="isEditing = true"
          />
          <labeled-item
            v-for="(item, index) in items"
            :key="'item' + index"
            :item="item"
            :compactLayout="compactLayout"
            class="text-primary"
          />
        </q-list>
      </div>
      <div v-else>
        <q-input
          :model-value="modelValue.employeeId"
          @update:model-value="save({employeeId: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('employeeId')"
        />
        <q-input
          :model-value="modelValue.jobTitle"
          @update:model-value="save({jobTitle: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('jobTitle')"
        />
        <q-input
          :model-value="modelValue.jobDescription"
          @update:model-value="save({jobDescription: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('jobDescription')"
          autogrow
        />
        <multiple-selectable-input
          :model-value="modelValue.positions"
          @update:model-value="save({positions: $event})"
          :label="$t('jobPositions')"
          :options="[]"
          class="q-mb-lg"
        />
        <div class="row q-gutter-x-md">
          <date-time-input
            :model-value="modelValue.employmentStart"
            @update:model-value="save({employmentStart: $event || null})"
            :label="$t('employmentStart')"
            :format="$t('dateFormat')"
            class="col"
            style="min-width: 200px"
          />
          <date-time-input
            :model-value="modelValue.employmentEnd"
            @update:model-value="save({employmentEnd: $event || null})"
            :label="$t('employmentEnd')"
            :format="$t('dateFormat')"
            class="col"
            style="min-width: 200px"
          />
        </div>
        <div class="row q-gutter-x-md">
          <q-input
            :model-value="formatNumber(modelValue.weeklyHours)"
            @update:model-value="save({weeklyHours: positiveOrNull(floatOrNull($event))})"
            :debounce="debounce"
            :label="$t('weeklyHours')"
            inputmode="decimal"
            min="0"
            max="70"
            class="col"
          />
          <q-input
            :model-value="formatNumber(modelValue.yearlyVacationDays)"
            @update:model-value="save({yearlyVacationDays: positiveOrNull(floatOrNull($event))})"
            :debounce="debounce"
            :label="$t('yearlyVacationDays')"
            inputmode="decimal"
            min="0"
            max="366"
            class="col"
          />
        </div>
        <div class="row">
          <q-input
            :model-value="formatNumber(modelValue.grossSalary, 'CurrencyNoGrouping')"
            @update:model-value="save({grossSalary: positiveOrNull(floatOrNull($event))})"
            :debounce="debounce"
            :label="$t('grossSalary')"
            inputmode="decimal"
            class="col-sm-6 col-12"
          />
        </div>
        <q-input
          :model-value="modelValue.salaryNotes"
          @update:model-value="save({salaryNotes: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('salaryNotes')"
          autogrow
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, Ref, computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { debounce, alwaysString, floatOrNull, positiveOrNull } from "src/helper/input";
import { didExpire } from "src/helper/expiration";
import { WorkAgreements } from "src/models/workAgreements";
import EditToggleButton from "src/components/EditToggleButton.vue";
import NoDataItem from "src/components/NoDataItem.vue";
import LabeledItem, { dateToItem, numberToItem, stringArrayToItem, stringToItem } from "src/components/LabeledItem.vue";
import DateTimeInput from "src/components/DateTimeInput.vue";
import MultipleSelectableInput from "src/components/MultipleSelectableInput.vue";

const { t, n } = useI18n();

const props = defineProps({
  modelValue: {
    type: Object as PropType<WorkAgreements | null>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: "update", payload: (value: WorkAgreements) => void): void
}>();

function save(changes: ((doc: WorkAgreements) => void) | Partial<WorkAgreements>) {
    let changeFn: (value: WorkAgreements) => void;

    if (typeof changes != "function") {
        changeFn = value => Object.assign(value, changes);
    } else {
        changeFn = changes;
    }

    emit("update", changeFn);
}

const isEditing = ref(false);
const isDisabled = computed(() => didExpire());
const compactLayout = ref(false);
const el: Ref<HTMLElement | null> = ref(null);

function onResize() {
  const width = el.value?.offsetWidth || 0;
  compactLayout.value = width <= 400;
}

const items = computed(() => [
  ...stringToItem(t("employeeId"), () => props.modelValue?.employeeId),
  ...stringToItem(t("jobTitle"), () => props.modelValue?.jobTitle),
  ...stringToItem(t("jobDescription"), () => props.modelValue?.jobDescription),
  ...stringArrayToItem(t("jobPositions"), () => props.modelValue?.positions),
  ...dateToItem(t("employmentStart"), () => props.modelValue?.employmentStart, "DateMed"),
  ...dateToItem(t("employmentEnd"), () => props.modelValue?.employmentEnd, "DateMed"),
  ...numberToItem(t("weeklyHours"), () => props.modelValue?.weeklyHours),
  ...numberToItem(t("yearlyVacationDays"), () => props.modelValue?.yearlyVacationDays),
  ...numberToItem(t("grossSalary"), () => props.modelValue?.grossSalary, "Currency"),
  ...stringToItem(t("salaryNotes"), () => props.modelValue?.salaryNotes),
]);

const formatNumber = (value: number | null, numberFormat = "") =>
  value != null
    ? n(value, numberFormat)
    : null;

</script>
