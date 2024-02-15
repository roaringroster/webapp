<template>
  <q-page
    padding
    class="limit-page-width width-md"
  >
    <masonry-wall
      :items="widgets"
      :column-width="240"
      :gap="12"
      :min-columns="1"
      :max-columns="3"
      class="q-mt-sm"
    >
      <template #default="{ item }">
        <component :is="item.component" v-bind="item.props" class="radius-md"/>
      </template>
    </masonry-wall>
  </q-page>
</template>

<style lang="sass">
</style>

<script setup lang="ts">
import { computed } from "vue";
import { date } from "quasar";
import MasonryWall from "@yeger/vue-masonry-wall";
import BirthdayWidget from "src/components/BirthdayWidget.vue";
import AbsenceWidget from "src/components/AbsenceWidget.vue";
import RequestWidget from "src/components/RequestWidget.vue";
import NotificationWidget from "src/components/NotificationWidget.vue";
import ShiftWidget from "src/components/ShiftWidget.vue";
import VacationWidget from "src/components/VacationWidget.vue";
import { createContact } from "src/models/contact";
import { Absence, createAbsence } from "src/models/absence";

const { startOfDate, addToDate } = date;

const makeContact = (firstName: string, lastName: string, birthday: Date) =>
  createContact({firstName, lastName, birthday: startOfDate(birthday, "day", true)})

const makeAbsence = (name: string, reason: string, end: Date) =>
  ({ name, absence: createAbsence({reason, end}) })

const birthdays = [
  makeContact("Groot", "", new Date()),
  makeContact("Meriadoc", "Brandybock", new Date()),
  makeContact("Harry", "Potter", addToDate(new Date(), {days: 12})),
  makeContact("Neville", "Longbottom", addToDate(new Date(), {days: 12})),
  makeContact("Pavel", "Checkov", addToDate(new Date(), {days: 3})),
];

const absences: {absence: Absence, name: string}[] = [
  makeAbsence("Lord Voldemort", "vacation", addToDate(new Date(), {days: 8})),
  makeAbsence("Darth Vader", "homeOffice", new Date()),
  makeAbsence("Sauron", "school", addToDate(new Date(), {days: 1})),
  makeAbsence("Heffalump", "illness", addToDate(new Date(), {days: 3})),
  makeAbsence("Khan Noonian Singh", "illness", addToDate(new Date(), {days: 7})),
];

const widgets = computed(() => [
  {
    component: BirthdayWidget, 
    props: { birthdays },
  }, {
    component: AbsenceWidget, 
    props: { absences },
  }, {
    component: RequestWidget,
    props: {},
  }, {
    component: NotificationWidget,
    props: {},
  }, {
    component: ShiftWidget,
    props: {},
  }, {
    component: VacationWidget,
    props: { vacation: {taken: 8, planned: 17, remaining: 5} },
  },
]);

</script>
