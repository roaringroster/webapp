<template>
  <widget-container :title="$t('today')">
    <q-card-section class="q-pt-none">
      <div v-if="birthdays.length" class="column q-gutter-sm">
        <div v-if="todaysBirthdays.length">
          {{ $t("todaysBirthdays", 
            [listFormatter.format(todaysBirthdays)], todaysBirthdays.length) }} 🥳🎂
        </div>
        <div v-if="upcomingBirthdays.length">
          <div>{{ $t("upcomingBirthdays") }}:</div>
          <ol class="no-bullet">
            <li
              v-for="(birthday, index) in upcomingBirthdays"
              :key="index"
            >{{ birthday }}</li>
          </ol>
        </div>
      </div>
      <div v-else class="text-italic">
         {{ $t("noUpcomingBirthdays") }}
      </div>
    </q-card-section>
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
import { date } from "quasar";
import WidgetContainer from "src/components/WidgetContainer.vue";
import { Contact, getName } from "src/models/contact";
import { Absence } from "src/models/absence";
import { locale } from "src/boot/i18n";

const { t, d } = useI18n();

const props = defineProps({
  birthdays: {
    type: Array as PropType<Contact[]>,
    default: () => []
  },
  absences: {
    type: Array as PropType<{absence: Absence, name: string}[]>,
    default: () => []
  },
});

const { isSameDate } = date;

const todaysBirthdays = computed(() => {
  const today = new Date();
  return props.birthdays
    .filter(contact => contact.birthday && isSameDate(contact.birthday, today, "day"))
    .map(getName);
});

const upcomingBirthdays = computed(() => {
  const today = new Date();
  return props.birthdays
    .filter(contact => contact.birthday && !isSameDate(contact.birthday, today, "day"))
    .sort((a, b) => a.birthday!.getTime() - b.birthday!.getTime())
    .map(contact => d(contact.birthday!, "DayMonthNumeric") + " " + getName(contact));
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

const listFormatter = computed(() => 
  new Intl.ListFormat(locale.value, { style: "long", type: "conjunction"})
);

</script>
