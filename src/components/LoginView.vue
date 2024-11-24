<template>
  <q-form v-if="isDataLoaded">
    <q-select
      v-model="username"
      :label="$t('selectUser')"
      :options="accountList"
      :behavior="selectBehavior()"
      hide-bottom-space
      :error-message="errorMessageUsername"
      :error="!!errorMessageUsername"
    />
    <q-input
      v-if="username"
      v-model="password"
      :label="$t('password')"
      type="password"
      hide-bottom-space
      :error-message="errorMessagePassword"
      :error="!!errorMessagePassword.length"
      class="q-mb-sm"
    />
    <div 
      v-if="(!!errorMessageUsername || !!errorMessagePassword) && errorDebugInfo" 
      class="full-width"
    >
      <text-with-tooltip
        text="Fehlerdetails"
        :tooltip="errorDebugInfo"
        class="q-mt-md text-caption text-grey-6 text-center"
        @click="errorDebugInfo = ''"
      />
    </div>
    <q-btn
      v-if="!!username && !!errorMessagePassword"
      :label="$t('problemsLoggingIn')"
      no-caps
      rounded
      flat
      color="primary"
      class="full-width"
      @click="showLoginProblemDialog"
    />
    <q-btn
      :label="$t('login')"
      :disable="!username || !password"
      type="submit"
      no-caps
      rounded
      color="primary-gradient"
      class="full-width q-mt-sm"
      @click.prevent="login"
      :loading="isLoading"
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import * as AppSettings from "src/database/AppSettings";
import { errorMessage, errorToString } from "src/boot/i18n";
import { useAccount } from "src/api/local2";
import { loginWithAuth, logoutWithAuth, deleteStorage, getOrganizationOrThrow } from "src/api/repo";
import { sanitizeHTML, selectBehavior } from "src/helper/utils";
import TextWithTooltip from "src/components/TextWithTooltip.vue";

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const {
  allUsernames,
  loginAccount,
  logoutAccount,
  deleteAccount,
} = useAccount();

const emit = defineEmits(["done", "update:accountlist"]);

const isDataLoaded = ref(false);
const accountList = ref([] as string[]);
const username = ref("");
const password = ref("");
const errorMessageUsername = ref("");
const errorMessagePassword = ref("");
const errorDebugInfo = ref("");
const isLoading = ref(false);

async function login() {
  errorMessageUsername.value = "";
  errorMessagePassword.value = "";
  isLoading.value = true;

  try {
    const account = await loginAccount(username.value, password.value);
    await loginWithAuth(account);
    getOrganizationOrThrow();
    await AppSettings.set("lastLoginUsername", username.value);

    emit("done");

  } catch(error) {
    await logoutWithAuth();
    logoutAccount();
    const message = errorToString(error);
    
    if (message.startsWith("Username")) {
      errorMessageUsername.value = errorMessage(error);
    } else {
      errorMessagePassword.value = errorMessage(error);
    }
  }

  isLoading.value = false;
  password.value = "";
}

function showLoginProblemDialog() {
  const user = {username: username.value};
  $q.dialog({
    title: t("problemsLoggingIn"),
    message: sanitizeHTML(t("problemsLoggingInMessage", user))
      .replace(/\n/g, "<br>"),
    html: true,
    persistent: true,
    stackButtons: $q.screen.lt.sm,
    ok: {
      label: t("deleteUser", user),
      rounded: true,
      flat: true,
      noCaps: true,
      color: "negative",
      autofocus: false,
    },
    cancel: {
      rounded: true,
      flat: true,
      noCaps: true,
      autofocus: true,
    }
  }).onOk(() => void deleteLocalAccount());
}

async function deleteLocalAccount() {
  errorMessageUsername.value = "";
  errorMessagePassword.value = "";
  password.value = "";
  isLoading.value = true;

  try {
    await deleteAccount(username.value).catch(() => {});
    await deleteStorage(username.value).catch(() => {});

    if ((await AppSettings.get("lastLoginUsername")) == username.value) {
        await updateAccountList();
        await AppSettings.set("lastLoginUsername", accountList.value[0]);
    }
  } catch(error) {
    errorMessagePassword.value = errorMessage(error);
  }

  await updateAccountList();
  isLoading.value = false;
}

async function updateAccountList() {
  accountList.value = await allUsernames();
  emit("update:accountlist", accountList.value);

  if (accountList.value.length == 0) {
    router.replace({ name: "auth" });
  } else if (accountList.value.length == 1) {
    username.value = accountList.value[0];
  } else {
    username.value = await AppSettings.get("lastLoginUsername") || "";
  }
}

onMounted(async () => {
  await updateAccountList();
  isDataLoaded.value = true;
});

</script>
