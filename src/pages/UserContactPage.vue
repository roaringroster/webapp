<template>
  <q-page padding>
    <contact-view 
      v-if="accountStore.memberContact"
      :modelValue="accountStore.memberContact"
      no-relationship
      no-organization
      no-profession
      no-url
      no-delete
      class="q-mb-lg"
      @update="updateContact"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useAccountStore } from "src/stores/accountStore";
import { ContactProps } from "src/models/contact";
import ContactView from "src/components/ContactView.vue";

const accountStore = useAccountStore();

function updateContact(changeFn: (contact: ContactProps) => void) {
  accountStore.memberContactHandle?.changeDoc(contact => changeFn(contact));
}

</script>
