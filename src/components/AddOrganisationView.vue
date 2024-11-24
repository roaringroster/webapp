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
import { locale, errorMessage, errorToString } from "src/boot/i18n";
import * as AppSettings from "src/database/AppSettings";
import { registerOrganization, deleteStorage, getOrganizationOrThrow, logoutWithAuth } from "src/api/repo";
import { LocalAccount, useAccount } from "src/api/local2";
import TextWithTooltip from "src/components/TextWithTooltip.vue";

const { 
  registerAccount, 
  persistAccountOnRegistration,
  loginAccount,
  logoutAccount,
  deleteAccount,
} = useAccount();

const emit = defineEmits(["done"]);

const newOrganizationName = ref("");
const newUsername = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");
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

  if (canCreateOrganization.value) {
    try {
      let account = await registerAccount(newUsername.value, newPassword1.value, 
        locale.value) as LocalAccount;
      const { organization, teamDocId } = await registerOrganization(account, newOrganizationName.value);
      account.organizations = [organization];
      account.activeOrganization = organization.shareId;
      account.activeTeam = teamDocId;
      await persistAccountOnRegistration(account, newPassword1.value);

      // login
      account = await loginAccount(newUsername.value, newPassword1.value);
      getOrganizationOrThrow();
      await AppSettings.set("lastLoginUsername", newUsername.value);

      emit("done");

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
          await deleteAccount(newUsername.value).catch(() => {});
          // with a catch method like above, deleteStorage won't delete;
          // sometimes it doesn't delete anyway, it is not reliable
          await deleteStorage(newUsername.value);
        } catch { }
      }
    }
  }

  isLoading.value = false;
}

</script>
