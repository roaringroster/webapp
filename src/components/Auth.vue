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
          :behavior="behavior"
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
          :rules="[val => !!val || $t('UsernameMissing')]"
        />
        <q-input
          v-model="newPassword1"
          :label="$t('password')"
          :rules="[val => !!val || $t('PasswordMissing')]"
          autocapitalize="off"
        />
        <q-input
          v-model="newPassword2"
          :label="$t('repeatPassword')"
          :rules="[val => !!val || $t('PasswordMissing')]"
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

<script lang="ts">
import { errorMessage, errorToString } from "src/boot/i18n";
import * as AppSettings from "src/database/AppSettings";
import { selectBehavior } from "src/helper/utils";
import { defineComponent } from "vue";
import { useAPI } from "src/api";
import { useRedirectStore } from "src/stores/redirectStore";
import { didExpire } from "src/helper/expiration";

const api = useAPI();
const redirectStore = useRedirectStore();

type AuthMode = "login" | "adduser";

export default defineComponent({
  name: "AuthView",

  data() {
    return {
      isDataLoaded: false,
      mode: "login" as AuthMode,
      username: "",
      password: "",
      errorMessageLoginUsername: "",
      errorMessageLoginPassword: "",
      errorMessageAddUser: "",
      isLoadingLogin: false,
      isLoadingAddUser: false,
      accountList: [] as string[],
      newUsername: "",
      newPassword1: "",
      newPassword2: "",
    }
  },

  computed: {
    hasAccounts(): boolean {
      return this.accountList.length > 0;
    },
    canCreateAccount(): boolean {
      return !!this.newUsername && !!this.newPassword1 && this.newPassword1 == this.newPassword2;
    },
    behavior() {
      return selectBehavior();
    }
  },

  methods: {
    async updateAccountList() {
      this.accountList = await api.allAccounts();
      this.isDataLoaded = true;

      if (this.accountList.length == 1) {
        this.username = this.accountList[0];
      } else {
        this.username = await AppSettings.get("lastLoginUsername") || "";
      }
    },

    async login() {
      this.errorMessageLoginUsername = "";
      this.errorMessageLoginPassword = "";
      this.isLoadingLogin = true;

      await api.login(this.username, this.password)
        .then(async () => {
          await AppSettings.set("lastLoginUsername", this.username);
          const location = await redirectStore.locationAfterLogin();
          void this.$router.push(location);
        })
        .catch(error => {
          const message = errorToString(error);
          
          if (message.startsWith("Username")) {
            this.errorMessageLoginUsername = errorMessage(error);
          } else {
            this.errorMessageLoginPassword = errorMessage(error);
          }
          return undefined;
        });

      this.isLoadingLogin = false;
      this.password = "";
    },

    async createAccount() {
      this.errorMessageAddUser = "";
      this.isLoadingAddUser = true;

      if (this.canCreateAccount) {
        try {
          await api.registerUser(this.newUsername, this.newPassword1, this.$i18n.locale);
          await AppSettings.set("lastLoginUsername", this.newUsername);
          await this.updateAccountList();
          this.switchMode("login");
        } catch(error) {
          this.errorMessageAddUser = errorMessage(error);
        }
      }

      this.isLoadingAddUser = false;
    },

    confirmDeleteAccount() {
      this.$q.dialog({
        title: this.$t("confirmDeletionTitle"),
        message: this.$t("deleteAccountMessage", {username: this.username}),
        persistent: true,
        ok: {
          label: this.$t("Delete"),
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
      }).onOk(() => void this.deleteAccount());
    },

    async deleteAccount() {
      this.errorMessageLoginUsername = "";
      this.errorMessageLoginPassword = "";
      this.password = "";
      this.isLoadingLogin = true;

      try {
        await api.deleteLocalAccount(this.username);

        if ((await AppSettings.get("lastLoginUsername")) == this.username) {
            await this.updateAccountList();
            await AppSettings.set("lastLoginUsername", this.accountList[0]);
        }
      } catch(error) {
        this.errorMessageLoginPassword = errorMessage(error);
      }

      await this.updateAccountList();
      this.isLoadingLogin = false;
    },

    switchMode(to: AuthMode) {
      this.mode = to;
      this.password = "";
      this.newUsername = "";
      this.newPassword1 = "";
      this.newPassword2 = "";
      this.errorMessageLoginUsername = "";
      this.errorMessageLoginPassword = "";
      this.errorMessageAddUser = "";
    },

    didExpire() {
      return didExpire()
    }
  },

  mounted() {
    void this.updateAccountList();
  },
});
</script>