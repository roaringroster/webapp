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
import { DocumentId } from "@automerge/automerge-repo";
import { useAccountStore } from "src/stores/accountStore";
import { createContact } from "src/models/contact";
import { Absence, createAbsence } from "src/models/absence";
import { createShift } from "src/models/roster";
import BirthdayWidget from "src/components/BirthdayWidget.vue";
import AbsenceWidget from "src/components/AbsenceWidget.vue";
import RequestWidget from "src/components/RequestWidget.vue";
import NotificationWidget from "src/components/NotificationWidget.vue";
import ShiftWidget from "src/components/ShiftWidget.vue";
import VacationWidget from "src/components/VacationWidget.vue";

const { startOfDate, addToDate } = date;
const accountStore = useAccountStore();

// – Data

const makeContact = (firstName: string, lastName: string, birthday: Date) =>
  createContact({firstName, lastName, birthday: startOfDate(birthday, "day", true)})

const makeAbsence = (name: string, reason: string, end: Date) =>
  ({ name, absence: createAbsence({reason, end}) })

const assignments = {
  1: [accountStore.userId as DocumentId],
  3: [accountStore.userId as DocumentId],
  5: [accountStore.userId as DocumentId],
}
const shifts = [
  createShift({assignments})
];
// const birthdays = [
//   makeContact("Groot", "", new Date()),
//   makeContact("Meriadoc", "Brandybock", new Date()),
//   makeContact("Harry", "Potter", addToDate(new Date(), {days: 12})),
//   makeContact("Neville", "Longbottom", addToDate(new Date(), {days: 12})),
//   makeContact("Pavel", "Checkov", addToDate(new Date(), {days: 3})),
// ];

// const absences: {absence: Absence, name: string}[] = [
//   makeAbsence("Lord Voldemort", "vacation", addToDate(new Date(), {days: 8})),
//   makeAbsence("Darth Vader", "homeOffice", new Date()),
//   makeAbsence("Sauron", "school", addToDate(new Date(), {days: 1})),
//   makeAbsence("Heffalump", "illness", addToDate(new Date(), {days: 3})),
//   makeAbsence("Khan Noonian Singh", "illness", addToDate(new Date(), {days: 7})),
// ];

const birthdays = [
  makeContact("Alice", "Adams", addToDate(new Date(), {days: 12})),
  makeContact("Bob", "Brown", new Date()),
  makeContact("Charlie", "Clark", new Date()),
  makeContact("Dave", "Diaz", addToDate(new Date(), {days: 12})),
  makeContact("Eve", "Evans", addToDate(new Date(), {days: 3})),
];

const absences: {absence: Absence, name: string}[] = [
  makeAbsence("Alice Adams", "vacation", addToDate(new Date(), {days: 8})),
  makeAbsence("Bob Brown", "homeOffice", new Date()),
  makeAbsence("Charlie Clark", "school", addToDate(new Date(), {days: 1})),
  makeAbsence("Dave Diaz", "illness", addToDate(new Date(), {days: 3})),
  makeAbsence("Eve Evans", "illness", addToDate(new Date(), {days: 7})),
];

const widgets = computed(() => [
  {
    component: RequestWidget,
    props: {},
  }, {
    component: NotificationWidget,
    props: {},
  }, {
    component: ShiftWidget,
    props: { shifts, userId: accountStore.userId },
  }, {
    component: AbsenceWidget, 
    props: { absences },
  }, {
    component: BirthdayWidget, 
    props: { birthdays },
  }, {
    component: VacationWidget,
    props: { vacation: {taken: 8, planned: 17, remaining: 5} },
  },
]);

</script>
