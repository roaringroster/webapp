<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
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

    <member-list :member-id="account?.user.userId"/>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { locale, i18n } from "src/boot/i18n";
import { useAccount } from "src/api/local2";
import { selectBehavior } from "src/helper/utils";
import { alwaysString } from "src/helper/input";
import { didExpire } from "src/helper/expiration";
import MemberList from "src/components/MemberList.vue";
import ChangePasswordView from "src/components/ChangePasswordView.vue";

const { t } = useI18n();
const { getAccountRef } = useAccount();

const localeOptions = computed(() => i18n.availableLocales.map(value => ({
  label: t(value.toLowerCase()),
  value
})));

const isDisabled = computed(() => didExpire());

const account = getAccountRef();
const serverAddress = ref(account.value?.settings.websocketServer || "");

</script>
