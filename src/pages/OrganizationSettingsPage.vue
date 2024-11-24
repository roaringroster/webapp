<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-input
      :label="$t('organizationName2')"
      :model-value="doc?.name"
      @update:model-value="changeDoc(doc => doc.name = alwaysString($event))"
      :debounce="debounce"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onUnmounted } from "vue";
import { useOrganizationDocument } from "src/api/repo";
import { debounce, alwaysString } from "src/helper/input";

const { doc, changeDoc, cleanup } = useOrganizationDocument();

onUnmounted(() => cleanup());

</script>
