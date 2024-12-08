<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-input
      :label="$t('organizationName2')"
      v-model="organizationName"
      :debounce="debounce"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAccountStore } from "src/stores/accountStore";
import { debounce, alwaysString } from "src/helper/input";

const accountStore = useAccountStore();

const organizationName = computed({
  get: () => accountStore.organization?.name || "",
  set: value => accountStore.organizationHandle?.changeDoc(org => 
    org.name = alwaysString(value)
  )
});

</script>
