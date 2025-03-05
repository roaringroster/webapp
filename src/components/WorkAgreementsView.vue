<template>
  <div
    v-if="doc" 
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
          :model-value="doc.employeeId"
          @update:model-value="save({employeeId: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('employeeId')"
        />
        <q-input
          :model-value="doc.jobTitle"
          @update:model-value="save({jobTitle: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('jobTitle')"
        />
        <q-input
          :model-value="doc.jobDescription"
          @update:model-value="save({jobDescription: alwaysString($event)})"
          :debounce="debounce"
          :label="$t('jobDescription')"
          autogrow
        />
        <multiple-selectable-input
          :model-value="doc.positions"
          @update:model-value="save({positions: $event})"
          :label="$t('jobPositions')"
          :options="[]"
          class="q-mb-lg"
        />
        <div class="row q-gutter-x-md">
          <date-time-input
            :model-value="doc.employmentStart"
            @update:model-value="save({employmentStart: $event || null})"
            :label="$t('employmentStart')"
            :format="$t('dateFormat')"
            class="col"
            style="min-width: 200px"
          />
          <date-time-input
            :model-value="doc.employmentEnd"
            @update:model-value="save({employmentEnd: $event || null})"
            :label="$t('employmentEnd')"
            :format="$t('dateFormat')"
            class="col"
            style="min-width: 200px"
          />
        </div>
        <div class="row q-gutter-x-md">
          <q-input
            :model-value="formatNumber(doc.weeklyHours)"
            @update:model-value="save({weeklyHours: positive(floatOrNull($event))})"
            :debounce="debounce"
            :label="$t('weeklyHours')"
            inputmode="decimal"
            min="0"
            max="70"
            class="col"
          />
          <q-input
            :model-value="formatNumber(doc.yearlyVacationDays)"
            @update:model-value="save({yearlyVacationDays: positive(floatOrNull($event))})"
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
            :model-value="formatNumber(doc.grossSalary, 'CurrencyNoGrouping')"
            @update:model-value="save({grossSalary: positive(floatOrNull($event))})"
            :debounce="debounce"
            :label="$t('grossSalary')"
            inputmode="decimal"
            class="col-sm-6 col-12"
          />
        </div>
        <q-input
          :model-value="doc.salaryNotes"
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
import { Ref, computed, ref, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useDocumentDeprecated as useDocument } from "src/api/repo";
import { debounce, alwaysString, floatOrNull, positive } from "src/helper/input";
import { didExpire } from "src/helper/expiration";
import { WorkAgreements } from "src/models/workAgreements";
import EditToggleButton from "src/components/EditToggleButton.vue";
import NoDataItem from "src/components/NoDataItem.vue";
import LabeledItem, { dateToItem, numberToItem, stringArrayToItem, stringToItem } from "src/components/LabeledItem.vue";
import DateTimeInput from "src/components/DateTimeInput.vue";
import MultipleSelectableInput from "src/components/MultipleSelectableInput.vue";

const { n } = useI18n();

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const docHandle = useDocument<WorkAgreements>(props.modelValue);
const doc = docHandle.doc;

async function save(changes: ((doc: WorkAgreements) => void) | Partial<WorkAgreements>) {
  const changeFn = typeof changes == "function"
    ? changes
    : (doc: WorkAgreements) => Object.assign(doc, changes);

  docHandle.changeDoc(changeFn);
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
  ...stringToItem("employeeId", () => doc.value?.employeeId),
  ...stringToItem("jobTitle", () => doc.value?.jobTitle),
  ...stringToItem("jobDescription", () => doc.value?.jobDescription),
  ...stringArrayToItem("jobPositions", () => doc.value?.positions),
  ...dateToItem("employmentStart", () => doc.value?.employmentStart, "DateMed"),
  ...dateToItem("employmentEnd", () => doc.value?.employmentEnd, "DateMed"),
  ...numberToItem("weeklyHours", () => doc.value?.weeklyHours),
  ...numberToItem("yearlyVacationDays", () => doc.value?.yearlyVacationDays),
  ...numberToItem("grossSalary", () => doc.value?.grossSalary, "Currency"),
  ...stringToItem("salaryNotes", () => doc.value?.salaryNotes),
]);

const formatNumber = (value: number | null, numberFormat = "") =>
  value != null
    ? n(value, numberFormat)
    : null

onUnmounted(() => {
  docHandle.cleanup();
})

</script>
