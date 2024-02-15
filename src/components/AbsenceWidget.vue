<template>
  <widget-container
    :title="$t('absences')"
    class="cursor-pointer"
    @click="$router.push({name: 'absences'})"
  >
    <q-card-section class="q-pt-none">
      <div v-if="absences.length" class="column q-gutter-sm">
        <div v-if="illnessAbsences.length">
          <div>
            {{ $t("illnessAbsences", illnessAbsences.length) }} 🤒🤕
          </div>
          <ol class="no-bullet">
            <li
              v-for="(absence, index) in illnessAbsences"
              :key="index"
            >{{ absence }}</li>
          </ol>
        </div>
        <div v-if="otherAbsences.length">
          <div>
            {{ $t("otherAbsences", otherAbsences.length) }}
          </div>
          <ol class="no-bullet">
            <li
              v-for="(absence, index) in otherAbsences"
              :key="index"
            >{{ absence }}</li>
          </ol>
        </div>
      </div>
      <div v-else class="text-italic">
         {{ $t("noAbsencesToday") }}
      </div>
    </q-card-section>
  </widget-container>
</template>

<script setup lang="ts">
import { PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Absence } from "src/models/absence";
import WidgetContainer from "src/components/WidgetContainer.vue";

const { t, d } = useI18n();

const props = defineProps({
  absences: {
    type: Array as PropType<{absence: Absence, name: string}[]>,
    default: () => []
  },
});

const illnessAbsences = computed(() => 
  props.absences
    .filter(({absence}) => absence.reason == "illness")
    .map(({absence, name}) => `${name} (${t("untilDate", {date: d(absence.end)})})`)
);

const otherAbsences = computed(() => 
  props.absences.filter(({absence}) => absence.reason != "illness")
    .sort((a, b) => a.absence.end.getTime() - b.absence.end.getTime())
    .map(({absence, name}) => 
      `${name} (${t(absence.reason)} ${t("untilDate", {date: d(absence.end)})})`
    )
);

</script>
