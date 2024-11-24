<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-input
      :label="$t('name')"
      :model-value="doc?.name"
      @update:model-value="changeDoc(doc => doc.name = alwaysString($event))"
      :debounce="debounce"
    />
    <MemberList/>
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted } from "vue";
import { useDocument2 } from "src/api/repo";
import { useAccount } from "src/api/local2";
import { debounce, alwaysString } from "src/helper/input";
import MemberList from "src/components/MemberList.vue";
import { Team } from "src/models/team";

const { getAccountRef } = useAccount();

const account = getAccountRef();
const { doc, changeDoc, cleanup } = useDocument2<Team>(account.value?.activeTeam || "");

onUnmounted(() => cleanup());

</script>
