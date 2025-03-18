<template>
  <q-page>
    <contact-list-split-view>
      <work-agreements-view 
        v-if="agreementsHandle?.doc"
        :model-value="agreementsHandle.doc"
        @update="updateAgreements"
      />
    </contact-list-split-view>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted, Ref, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDocument } from "src/api/repo";
import { useAccountStore } from "src/stores/accountStore";
import { WorkAgreements } from "src/models/workAgreements";
import ContactListSplitView from "src/components/ContactListSplitView.vue";
import WorkAgreementsView from "src/components/WorkAgreementsView.vue";

const route = useRoute();
const accountStore = useAccountStore();

const agreementsHandle: Ref<ReturnType<typeof useDocument<WorkAgreements>> | null> = ref(null);
onUnmounted(() => agreementsHandle.value?.cleanup());

watch(
  () => route.params.memberId,
  memberId => {
    if (memberId) {
      const member = accountStore.organization?.members[memberId?.toString()];

      if (member) {
        agreementsHandle.value?.cleanup();
        agreementsHandle.value = useDocument<WorkAgreements>(member.workAgreementsId);
      }
    }
  },
  { immediate: true }
);

function updateAgreements(changeFn: (agreements: WorkAgreements) => void) {
  agreementsHandle.value?.changeDoc(agreements => changeFn(agreements));
}

</script>
