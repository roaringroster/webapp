<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-input
      :label="$t('name')"
      v-model="teamName"
      :debounce="debounce"
    />
    <MemberList/>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAccountStore } from "src/stores/accountStore";
import { debounce, alwaysString } from "src/helper/input";
import MemberList from "src/components/MemberList.vue";

const accountStore = useAccountStore();

const teamName = computed({
  get: () => accountStore.team?.name || "",
  set: value => accountStore.teamHandle?.changeDoc(team => 
    team.name = alwaysString(value)
  )
});

</script>
