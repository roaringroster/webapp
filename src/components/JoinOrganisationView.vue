<template>
  <q-form>
    <div class="text-center text-grey-9 text-subtitle1 text-weight-medium q-mb-sm">{{ $t("addNewDevice") }}</div>
        <q-separator inset />
    <div v-if="mode == 'enterCode'">
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
        :label="$t(isDeviceInvitation ? 'addDevice' : 'addMember')"
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
import * as AppSettings from "src/database/AppSettings";
import { LocalAccount, useAccount } from "src/api/local2";
import { deleteStorage, getOrganizationOrThrow, joinOrganization, logoutWithAuth } from "src/api/repo";
import { InvitationCodeLength } from "src/helper/utils";
import { requestPermissions, useDiagnostic } from "src/helper/cordova";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import QRCodeScanner from "src/components/QRCodeScanner.vue";

const route = useRoute();
const $q = useQuasar();
const { 
  registerAccount, 
  persistAccountOnRegistration,
  loginAccount,
  logoutAccount,
  deleteAccount,
} = useAccount();

const emit = defineEmits(["done"]);

type Mode = "enterCode" | "createAccount";
const mode = ref("enterCode" as Mode);

const invitationCode = ref(route.params.code?.toString() || "");

watch(
  () => route.params.code,
  () => invitationCode.value = route.params.code?.toString() || "",
)

function next() {
  if (isValidInvitationCode.value) {
    mode.value = "createAccount";
  } else {
    throw new Error("InvitationCodeMissing");
  }
}

const isValidInvitationCode = computed(() => invitationCode.value.length == InvitationCodeLength);
const isDeviceInvitation = computed(() => 
  isValidInvitationCode.value
    && (base58.decode(invitationCode.value.at(-1) || "").at(0) || 0) < InvitationCodeLength
);

const newUsername = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");
const errorMessageText = ref("");
const errorDebugInfo = ref("");
const isLoading = ref(false);

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

  if (canCreateAccount.value) {
    try {
      let account = await registerAccount(newUsername.value, newPassword1.value, 
        locale.value, isDeviceInvitation.value);
      const { organization, user, teamDocId } = await joinOrganization(account, invitationCode.value)
        .catch(error => { throw error });
      account.organizations = [organization];
      account.activeOrganization = organization.shareId;
      account.activeTeam = teamDocId;
      account.device.userId = user.userId;
      account.user = account.user || user;
      // ensure username is identical to input, because the one in auth chain might differ
      account.user.userName = newUsername.value;
      await persistAccountOnRegistration(account as LocalAccount, newPassword1.value);

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
