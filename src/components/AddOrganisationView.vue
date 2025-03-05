<template>
  <q-form>
    <div class="text-center text-grey-9 text-subtitle1 text-weight-medium q-mb-sm">{{ $t("addNewOrganization") }}</div>
    <q-separator inset />
    <q-input
      v-model="newOrganizationName"
      :label="$t('organizationName2')"
      :rules="[(val: any) => !!val || $t('OrganizationNameMissing')]"
      reactive-rules
    />
    <q-input
      v-model="newUsername"
      :label="$t('username')"
      :rules="[(val: any) => !!val || $t('UsernameMissing')]"
      reactive-rules
    />
    <q-input
      v-model="newPassword1"
      :label="$t('password')"
      :rules="[(val: any) => !!val || $t('PasswordMissing')]"
      reactive-rules
      autocapitalize="off"
      autocomplete="off"
    />
    <q-input
      v-model="newPassword2"
      :label="$t('repeatPassword')"
      :rules="[(val: any) => !!val || $t('PasswordMissing')]"
      reactive-rules
      autocapitalize="off"
      autocomplete="off"
    />
    <reveal-button
      v-if="isDev"
      :label="$t('ownServerAddress') + '?'"
      class="text-center"
    >
      <q-input
        v-model="server"
        :label="$t('ownServerAddress')"
        :placeholder="$t('hostname')"
      />
    </reveal-button>
    <text-with-tooltip
      v-if="errorMessageText" 
      :text="errorMessageText"
      :tooltip="errorDebugInfo"
      class="q-mt-md text-negative text-caption"
      icon-class="hidden"
    />
    <q-btn
      :label="$t('addOrganization')"
      :disabled="!canCreateOrganization"
      type="submit"
      no-caps
      rounded
      color="primary-gradient"
      class="full-width q-mt-md"
      @click.prevent="createOrganization"
      :loading="isLoading"
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { locale, errorMessage, errorToString } from "src/boot/i18n";
import * as AppSettings from "src/database/AppSettings";
import { registerOrganization, deleteStorage, getOrganizationOrThrow, logoutWithAuth } from "src/api/repo";
import { LocalAccount, useAccount } from "src/api/local2";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import { bus } from "src/boot/eventBus";
import { useAccountStore } from "src/stores/accountStore";
import { isDev } from "src/helper/appInfo";
import PasswordSecuritySheet from "src/components/PasswordSecuritySheet.vue";
import RevealButton from "src/components/RevealButton.vue";

const $q = useQuasar();

const { 
  registerAccount, 
  persistAccountOnRegistration,
  loginAccount,
  logoutAccount,
  deleteAccount,
} = useAccount();
const accountStore = useAccountStore();

const emit = defineEmits(["done"]);

const newOrganizationName = ref("");
const newUsername = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");
const server = ref("");
const errorMessageText = ref("");
const errorDebugInfo = ref("");
const isLoading = ref(false);

const canCreateAccount = computed(() =>
  !!newUsername.value && !!newPassword1.value && newPassword1.value == newPassword2.value
);
const canCreateOrganization = computed(() =>
  !!newOrganizationName.value && canCreateAccount.value
);

async function createOrganization() {
  errorMessageText.value = "";
  isLoading.value = true;
  const username = newUsername.value;
  const password = newPassword1.value;
  const organizationName = newOrganizationName.value;

  if (canCreateOrganization.value) {
    try {
      let account = await registerAccount(username, password, locale.value) as LocalAccount;
      const { organization, teamId } = await registerOrganization(account, organizationName, server.value);
      account.organizations = [organization];
      account.activeOrganization = organization.shareId;
      account.activeTeam = teamId;
      await persistAccountOnRegistration(account, password);

      // login
      account = await loginAccount(username, password);
      getOrganizationOrThrow();

      $q.dialog({
        component: PasswordSecuritySheet
      })
      .onOk(async () => {
        await accountStore.login();
        bus.emit("did-login");
        await AppSettings.set("lastLoginUsername", username);

        emit("done");
      });

    } catch(error) {
      errorMessageText.value = errorMessage(error);
      errorDebugInfo.value = `${error}`;
      await logoutWithAuth();
      logoutAccount();

      if (errorToString(error) != "UsernameExists") {
        // we need the try block, otherwise deleteStorage won't delete
        try {
          // we need the catch method, because deleteAccount will likely throw and
          // prevent deleteStorage from being executed
          await deleteAccount(username).catch(() => {});
          // with a catch method like above, deleteStorage won't delete;
          // sometimes it doesn't delete anyway, it is not reliable
          await deleteStorage(username);
        } catch { }
      }
    }
  }

  isLoading.value = false;
}

</script>
