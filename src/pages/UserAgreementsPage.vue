<template>
  <q-page padding>
    <work-agreements-view 
      v-if="agreements"
      :modelValue="agreements"
      class="q-mb-lg"
      @update="updateAgreements"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useAccountStore } from "src/stores/accountStore";
import { WorkAgreements } from "src/models/workAgreements";
import WorkAgreementsView from "src/components/WorkAgreementsView.vue";
import { computed, onUnmounted } from "vue";
import { useDocument } from "src/api/repo";

const accountStore = useAccountStore();

const agreementsHandle = computed(() =>
  accountStore.member?.workAgreementsId
    ? useDocument<WorkAgreements>(accountStore.member.workAgreementsId)
    : null
);
onUnmounted(() => agreementsHandle.value?.cleanup());
const agreements = computed(() => agreementsHandle.value?.doc.value);

function updateAgreements(changeFn: (document: WorkAgreements) => void) {
  agreementsHandle.value?.changeDoc(document => changeFn(document));
}

</script>
