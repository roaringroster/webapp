<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <q-select
      :model-value="locale"
      @update:model-value="$bus.emit('did-change-locale', $event)"
      :label="$t('appLanguageSetting')"
      :options="localeOptions"
      emit-value
      :behavior="selectBehavior()"
      map-options
      class="q-mt-lg"
      style="max-width: 360px"
    />
    <q-input
      :model-value="serverAddress"
      @update:model-value="serverAddress = alwaysString($event)"
      :label="$t('syncServerAddress')"
      style="max-width: 360px"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { locale, i18n } from "src/boot/i18n";
import { selectBehavior } from "src/helper/utils";
import { alwaysString } from "src/helper/input";

const { t } = useI18n();

const localeOptions = computed(() => i18n.availableLocales.map(value => ({
  label: t(value.toLowerCase()),
  value
})));

const serverAddress = ref("");

</script>
