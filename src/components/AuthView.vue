<template>
  <q-card
    v-if="isDataLoaded"
    style="width: 280px"
  >
    <q-card-section v-if="hasAccounts && mode == 'login'">
      <q-form>
        <q-select
          v-model="username"
          :label="$t('selectUser')"
          :options="accountList"
          :behavior="selectBehavior()"
          hide-bottom-space
          :error-message="errorMessageLoginUsername"
          :error="!!errorMessageLoginUsername"
        />
        <q-input
          v-if="username"
          v-model="password"
          :label="$t('password')"
          type="password"
          hide-bottom-space
          :error-message="errorMessageLoginPassword"
          :error="!!errorMessageLoginPassword.length"
        />
        <q-btn
          :label="$t('login')"
          :disable="!username || !password"
          type="submit"
          no-caps
          rounded
          color="primary-gradient"
          class="full-width q-mt-md"
          @click.prevent="login"
          :loading="isLoadingLogin"
        />
      </q-form>
      <q-btn
        v-if="!didExpire()"
        :label="$t('addNewUser')"
        no-caps
        rounded
        flat
        color="primary"
        class="full-width q-mt-sm"
        @click="switchMode('adduser')"
      />
      <q-btn
        v-if="username"
        :label="$t('deleteUser', {username})"
        no-caps
        rounded
        flat
        color="primary"
        class="full-width q-mt-sm"
        @click="confirmDeleteAccount"
      />
    </q-card-section>
    <q-card-section v-else>
      <q-form>
        <q-input
          v-model="newUsername"
          :label="$t('username')"
          :rules="[(val: any) => !!val || $t('UsernameMissing')]"
        />
        <q-input
          v-model="newPassword1"
          :label="$t('password')"
          :rules="[(val: any) => !!val || $t('PasswordMissing')]"
          autocapitalize="off"
        />
        <q-input
          v-model="newPassword2"
          :label="$t('repeatPassword')"
          :rules="[(val: any) => !!val || $t('PasswordMissing')]"
          autocapitalize="off"
        />
        <div v-if="errorMessageAddUser" class="q-mt-md text-negative text-caption">{{ errorMessageAddUser }}</div>
        <q-btn
          :label="$t('addUser')"
          :disabled="!canCreateAccount"
          type="submit"
          no-caps
          rounded
          color="primary-gradient"
          class="full-width q-mt-md"
          @click.prevent="createAccount"
          :loading="isLoadingAddUser"
        />
        <q-btn
          v-if="hasAccounts"
          :label="$t('cancel')"
          no-caps
          rounded
          flat
          color="primary"
          class="full-width q-mt-sm"
          @click="switchMode('login')"
        />
      </q-form>
    </q-card-section>
  </q-card>
  <!-- <div 
    v-if="(!!errorMessageLoginPassword || !!errorMessageLoginUsername) && errorDebugInfo" 
    class="full-width"
  >
    <text-with-tooltip
      text="Fehlerdetails"
      :tooltip="errorDebugInfo"
      class="q-mt-md text-caption text-grey-6 text-center"
      @click="errorDebugInfo = ''"
    />
  </div> -->
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { locale, errorMessage, errorToString } from "src/boot/i18n";
import * as AppSettings from "src/database/AppSettings";
import { selectBehavior } from "src/helper/utils";
import { useAPI } from "src/api";
import { useRedirectStore } from "src/stores/redirectStore";
import { didExpire } from "src/helper/expiration";

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();
const api = useAPI();
const redirectStore = useRedirectStore();

type AuthMode = "login" | "adduser";

const isDataLoaded = ref(false);
const mode = ref("login" as AuthMode);
const username = ref("");
const password = ref("");
const errorMessageLoginUsername = ref("");
const errorMessageLoginPassword = ref("");
const errorMessageAddUser = ref("");
const isLoadingLogin = ref(false);
const isLoadingAddUser = ref(false);
const accountList = ref([] as string[]);
const newUsername = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");

const hasAccounts = computed(() => accountList.value.length > 0);
const canCreateAccount = computed(() =>
  !!newUsername.value && !!newPassword1.value && newPassword1.value == newPassword2.value
);

async function updateAccountList() {
  accountList.value = await api.allAccounts();
  isDataLoaded.value = true;

  if (accountList.value.length == 1) {
    username.value = accountList.value[0];
  } else {
    username.value = await AppSettings.get("lastLoginUsername") || "";
  }
}

async function login() {
  errorMessageLoginUsername.value = "";
  errorMessageLoginPassword.value = "";
  isLoadingLogin.value = true;

  await api.login(username.value, password.value)
    .then(async () => {
      await AppSettings.set("lastLoginUsername", username.value);
      const location = await redirectStore.locationAfterLogin();
      void router.push(location);
    })
    .catch(error => {
      const message = errorToString(error);
      
      if (message.startsWith("Username")) {
        errorMessageLoginUsername.value = errorMessage(error);
      } else {
        errorMessageLoginPassword.value = errorMessage(error);
      }
      return undefined;
    });

  isLoadingLogin.value = false;
  password.value = "";
}

async function createAccount() {
  errorMessageAddUser.value = "";
  isLoadingAddUser.value = true;

  if (canCreateAccount.value) {
    try {
      await api.registerUser(newUsername.value, newPassword1.value, locale.value);
      await AppSettings.set("lastLoginUsername", newUsername.value);
      await updateAccountList();
      switchMode("login");
    } catch(error) {
      errorMessageAddUser.value = errorMessage(error);
    }
  }

  isLoadingAddUser.value = false;
}

function confirmDeleteAccount() {
  $q.dialog({
    title: t("confirmDeletionTitle"),
    message: t("deleteAccountMessage", {username: username.value}),
    persistent: true,
    ok: {
      label: t("Delete"),
      rounded: true,
      flat: true,
      noCaps: true,
      color: "negative",
    },
    cancel: {
      rounded: true,
      flat: true,
      noCaps: true,
    }
  }).onOk(() => void deleteAccount());
}

async function deleteAccount() {
  errorMessageLoginUsername.value = "";
  errorMessageLoginPassword.value = "";
  password.value = "";
  isLoadingLogin.value = true;

  try {
    await api.deleteLocalAccount(username.value);

    if ((await AppSettings.get("lastLoginUsername")) == username.value) {
        await updateAccountList();
        await AppSettings.set("lastLoginUsername", accountList.value[0]);
    }
  } catch(error) {
    errorMessageLoginPassword.value = errorMessage(error);
  }

  await updateAccountList();
  isLoadingLogin.value = false;
}

function switchMode(to: AuthMode) {
  mode.value = to;
  password.value = "";
  newUsername.value = "";
  newPassword1.value = "";
  newPassword2.value = "";
  errorMessageLoginUsername.value = "";
  errorMessageLoginPassword.value = "";
  errorMessageAddUser.value = "";
}

onMounted(() => void updateAccountList());

</script>