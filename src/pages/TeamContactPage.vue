<template>
  <q-page>
    <contact-list-split-view>
      <contact-view 
        v-if="contactHandle?.doc"
        :model-value="contactHandle?.doc"
        no-relationship
        no-organization
        no-profession
        no-url
        no-delete
        @update="updateContact"
      />
    </contact-list-split-view>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, Ref, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDocument } from "src/api/repo";
import { useAccountStore } from "src/stores/accountStore";
import { ContactProps } from "src/models/contact";
import ContactListSplitView from "src/components/ContactListSplitView.vue";
import ContactView from "src/components/ContactView.vue";

const route = useRoute();
const accountStore = useAccountStore();

const contactHandle: Ref<ReturnType<typeof useDocument<ContactProps>> | null> = ref(null);
onUnmounted(() => contactHandle.value?.cleanup());

watch(
  () => route.params.memberId,
  memberId => {
    if (memberId) {
      const member = accountStore.organization?.members[memberId?.toString()];

      if (member) {
        contactHandle.value?.cleanup();
        contactHandle.value = useDocument<ContactProps>(member.contactId);
      }
    }
  },
  { immediate: true }
);

function updateContact(changeFn: (contact: ContactProps) => void) {
  contactHandle.value?.changeDoc(contact => changeFn(contact));
}

</script>
