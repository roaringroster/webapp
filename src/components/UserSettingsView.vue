<template>
  <div v-if="!!accountStore.userId">
    <div class="section-heading q-mt-none">{{ $t("appSettings") }}</div>
    <div>
      <q-select
        :model-value="locale"
        @update:model-value="$bus.emit('did-change-locale', $event)"
        :label="$t('appLanguageSetting')"
        :options="localeOptions"
        emit-value
        :behavior="selectBehavior()"
        map-options
        style="max-width: 360px"
      />
      <q-input
        v-if="!isDisabled"
        :model-value="serverAddress"
        @update:model-value="serverAddress = alwaysString($event)"
        :label="$t('syncServerAddress')"
        style="max-width: 360px"
        class="q-mb-sm"
      />
      <change-password-view/>
    </div>

    <member-list :member-id="accountStore.userId"/>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { locale, i18n } from "src/boot/i18n";
import { selectBehavior } from "src/helper/utils";
import { alwaysString } from "src/helper/input";
import { didExpire } from "src/helper/expiration";
import MemberList from "src/components/MemberList.vue";
import ChangePasswordView from "src/components/ChangePasswordView.vue";
import { useAccountStore } from "src/stores/accountStore";

const { t } = useI18n();

const localeOptions = computed(() => i18n.availableLocales.map(value => ({
  label: t(value.toLowerCase()),
  value
})));

const isDisabled = computed(() => didExpire());

const accountStore = useAccountStore();
const serverAddress = ref(accountStore.account?.organizations.find(({ shareId }) => shareId == accountStore.account?.activeOrganization)?.websocketServer || "");

</script>
