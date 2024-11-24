<template>
  <div>
    <q-btn
      v-if="!isChangePassword"
      :label="$t('changePassword')"
      no-caps
      flat
      rounded
      color="primary"
      @click="isChangePassword = true"
    />
    <div v-else>
      <div class="row q-col-gutter-x-md">
        <q-input
          v-model="oldPassword"
          :label="$t('currentPassword')"
          class="col-12"
          autocapitalize="off"
          autocomplete="off"
          autofocus
        />
        <q-input
          v-model="newPassword1"
          :label="$t('newPassword')"
          class="col-sm-6 col-12"
          autocapitalize="off"
          autocomplete="off"
        />
        <q-input
          v-model="newPassword2"
          :label="$t('repeatNewPassword')"
          class="col-sm-6 col-12"
          autocapitalize="off"
          autocomplete="off"
        />
      </div>
      <div v-if="errorMessagePassword" class="q-mt-md text-negative">{{ errorMessagePassword }}</div>
      <div class="q-mt-md row items-center">
        <q-btn
          :label="$t('changePassword')"
          no-caps
          unelevated
          rounded
          color="primary"
          class="q-mr-md"
          :disabled="!canChangePassword"
          @click="applyPasswordChange"
        />
        <q-btn
          :label="$t('cancel')"
          no-caps
          flat
          rounded
          color="primary"
          @click="endChangePasswordMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAccount } from "src/api/local2";
import { errorMessage } from "src/boot/i18n";
import { notifySuccess } from "src/helper/notify";

const { t } = useI18n();
const { changePassword } = useAccount();

const oldPassword = ref("");
const newPassword1 = ref("");
const newPassword2 = ref("");
const canChangePassword = computed(() => 
  !!oldPassword.value && !!newPassword1.value 
    && newPassword1.value == newPassword2.value
);
const isChangePassword = ref(false);
const errorMessagePassword = ref("");

async function applyPasswordChange() {
  if (canChangePassword.value) {
    try {
      await changePassword(oldPassword.value, newPassword1.value);
      endChangePasswordMode();
      notifySuccess(t("passwordChangeSuccessMessage"));
    } catch(error) {
      errorMessagePassword.value = errorMessage(error);
    }
  }
}

function endChangePasswordMode() {
  isChangePassword.value = false;
  oldPassword.value = "";
  newPassword1.value = "";
  newPassword2.value = "";
  errorMessagePassword.value = "";
}

</script>
