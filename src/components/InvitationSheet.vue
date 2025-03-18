<template>
  <editing-sheet
    ref="dialogRef"
    :title="$t('createInvitationCode')"
    :hasPendingChanges="() => false"
    @ok="onDone"
    @hide="emit('hide')"
    hasDoneButton
    is-data-available
    :maxWidth="480"
  >
    <div class="invitation-code-sheet">
      <q-select
        v-model="expirationSelect"
        :label="$t('invitationExpirationLabel')"
        :options="expirationOptions"
        map-options
        emit-value
        :behavior="selectBehavior()"
        options-dense
        hide-bottom-space
      />
      <div class="col q-mt-lg">
        <div 
          class="q-field__label ellipsis" 
          style="font-size: .75rem; margin: 6px 0 -2px; height: 16px"
        >{{ $t('invitationMaxUsesLabel') }}</div>
        <q-input
          v-model="maxUsesDisplayValue"
          inputmode="numeric"
          pattern="[0-9]"
          :maxlength="maxMaxUses.toString().length"
          color="primary"
          input-class="text-center"
          dense
        >
          <template v-slot:prepend>
            <q-btn
              icon="fas fa-minus"
              flat
              round
              dense
              color="primary"
              @click="maxUsesInput = maxUsesInput > minMaxUses ? maxUsesInput - 1 : maxMaxUses"
            />
          </template>
          <template v-slot:append>
            <q-btn
              icon="fas fa-plus"
              flat
              round
              dense
              color="primary"
              @click="maxUsesInput = maxUsesInput < maxMaxUses ? maxUsesInput + 1 : minMaxUses"
            />
          </template>
        </q-input>
      </div>
      <div class="q-mt-lg text-caption text-grey-8 line-height-12">
        {{ t("teamMemberInvitationDescription", { appName }) }}
      </div>
    </div>
  </editing-sheet>
</template>

<style lang="sass">
.invitation-code-sheet
  max-width: 360px
  margin: 0 auto
</style>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDialogPluginComponent } from "quasar";
import { locale } from "src/boot/i18n";
import { selectBehavior } from "src/helper/utils";
import { appName } from "src/helper/appInfo";
import { timeago } from "src/helper/relativeTime";
import { alwaysInt } from "src/helper/input";
import EditingSheet from "src/components/EditingSheet.vue";

const { t } = useI18n();

const expirationSelect = ref(30 * 60_000);
const expirationOptions = [5, 30, 60, 24 * 60, 7 * 24 * 60]
  .map(val => {
    const value = val * 60_000;
    const label = timeago(Date.now() + value, locale.value);
    return { label, value };
  })
  .concat({
    label: t("never"),
    value: 0
  })

const maxUsesInput = ref(1);
const minMaxUses = 0;
const maxMaxUses = 50;
const maxUsesDisplayValue = computed({
  get() {
    return maxUsesInput.value != 0 
      ? "" + maxUsesInput.value
      : t("unlimited")
  },
  set(newValue) {
    const value = Math.abs(alwaysInt(newValue, maxUsesInput.value));

    if (newValue == t("unlimited") || value > maxMaxUses) {
      maxUsesInput.value = 0;
    } else {
      maxUsesInput.value = value;
    }
  }
})

function onDone() {
  (dialogRef.value as unknown as EditingSheet)?.confirm();
  const nowOrNever = expirationSelect.value
    ? Date.now()
    : 0;
  const expiration = nowOrNever + expirationSelect.value;
  const maxUses = maxUsesInput.value;
  emit("ok", { expiration, maxUses });
}

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();

</script>