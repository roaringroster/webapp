<template>
  <q-form>
    <div v-if="mode == 'enterCode'">
      <div 
        class="text-center text-grey-9 text-subtitle1 text-weight-medium q-mb-sm"
      >
        {{ $t("addNewDevice") }}
      </div>
      <q-separator inset />
      <q-input
        v-model="invitationCode"
        :label="$t('invitationCode')"
      >
        <template v-if="canUseCamera" v-slot:append>
          <q-btn
            icon="fas fa-camera"
            :title="$t('scanQRCode')"
            color="primary"
            round
            flat
            dense
            @click.stop.prevent="showQRCodeScanner"
          />
        </template>
      </q-input>
      <text-with-tooltip
        :text="$t('joinWithInvitationHint')"
        :tooltip="$t('joinWithInvitationTooltip', {InvitationCodeLength})"
        class="q-mt-md text-grey-8 text-caption"
      />
      <q-btn
        :label="$t('continue')"
        :disabled="!isValidInvitationCode"
        type="submit"
        no-caps
        rounded
        color="primary-gradient"
        class="full-width q-mt-md"
        @click.prevent="next"
      />
    </div>
    <div v-else>
      <div 
        class="text-center text-grey-9 text-subtitle1 text-weight-medium q-mb-sm"
        @dblclick="revealServer = !revealServer"
      >
        {{ isDeviceInvitation ? $t("addDeviceTitle") : $t("addMemberTitle") }}
      </div>
      <q-separator inset />
      <div class="q-mt-sm text-grey-10 text-caption text-center">
        {{ isDeviceInvitation ? $t('addDeviceHint') : $t('addMemberHint') }}
      </div>
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
        v-if="isDev || revealServer"
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
        :label="isDeviceInvitation ? $t('addDevice') : $t('addMember')"
        :disabled="!canCreateAccount"
        type="submit"
        no-caps
        rounded
        color="primary-gradient"
        class="full-width q-mt-md"
        @click.prevent="joinOrganisation"
        :loading="isLoading"
      >
        <template v-slot:loading>
          <q-spinner class="on-left" />
          {{ $t("waitingForAdmission") }}
        </template>
      </q-btn>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { base58 } from "@localfirst/crypto";
import { locale, errorMessage, errorToString } from "src/boot/i18n";
import { bus } from "src/boot/eventBus";
import { useAccountStore } from "src/stores/accountStore";
import * as AppSettings from "src/database/AppSettings";
import { LocalAccount, useAccount } from "src/api/local2";
import { deleteStorage, getOrganizationOrThrow, joinOrganization, logoutWithAuth } from "src/api/repo";
import { initializeDemo } from "src/api/demoRepo";
import { InvitationCodeLength } from "src/helper/utils";
import { requestPermissions, useDiagnostic } from "src/helper/cordova";
import { isDev } from "src/helper/appInfo";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import QRCodeScanner from "src/components/QRCodeScanner.vue";
import PasswordSecuritySheet from "src/components/PasswordSecuritySheet.vue";
import RevealButton from "src/components/RevealButton.vue";

const route = useRoute();
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

type Mode = "enterCode" | "createAccount";
const mode = ref("enterCode" as Mode);

const invitationCode = ref(route.params.code?.toString() || "");
const isDemo = computed(() => invitationCode.value == "demo");

watch(
  () => route.params.code,
  () => invitationCode.value = route.params.code?.toString() || "",
)

async function next() {
  if (isDemo.value) {
    await initializeDemo(locale.value);
    await accountStore.login();
    bus.emit("did-login");
    return emit("done");
  }

  if (isValidInvitationCode.value) {
    mode.value = "createAccount";
  } else {
    throw new Error("InvitationCodeMissing");
  }
}

const isValidInvitationCode = computed(() => 
  invitationCode.value.length == InvitationCodeLength || isDemo.value
);
const isDeviceInvitation = computed(() => 
  !isValidInvitationCode.value
    || (base58.decode(invitationCode.value.at(-1) || "").at(0) || 0) < InvitationCodeLength
);

const newUsername = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");
const server = ref("");
const errorMessageText = ref("");
const errorDebugInfo = ref("");
const isLoading = ref(false);
const revealServer = ref(false);

const canCreateAccount = computed(() =>
  isValidInvitationCode.value
    && (isDeviceInvitation.value || !!newUsername.value.trim()) 
    && !!newPassword1.value && newPassword1.value == newPassword2.value
);
const canUseCamera = window.isSecureContext == true
  && navigator?.mediaDevices?.getUserMedia != undefined;

async function joinOrganisation() {
  errorMessageText.value = "";
  isLoading.value = true;
  const username = newUsername.value;
  const password = newPassword1.value;

  if (canCreateAccount.value) {
    try {
      let account = await registerAccount(username, password, 
        locale.value, isDeviceInvitation.value);
      const { organization, user, teamId } = await joinOrganization(
          account, invitationCode.value, server.value
        )
        .catch(error => { throw error });
      account.organizations = [organization];
      account.activeOrganization = organization.shareId;
      account.activeTeam = teamId;
      account.device.userId = user.userId;
      account.user = account.user || user;
      // ensure username is identical to input, because the one in auth chain might differ
      account.user.userName = username;
      await persistAccountOnRegistration(account as LocalAccount, password);

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
      logoutWithAuth();
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
          // eslint-disable-next-line no-empty
        } catch { }
      }
    }
  }

  isLoading.value = false;
}

async function showQRCodeScanner() {
  try {
    await requestPermissions([useDiagnostic()?.permission?.CAMERA || ""]);

    $q.dialog({
      component: QRCodeScanner,
    })
    .onOk(code => invitationCode.value = code);

  } catch (error) {
    console.error(error);
  }
}

</script>
