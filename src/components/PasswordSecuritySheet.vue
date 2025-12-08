<template>
  <editing-sheet
    ref="dialogRef"
    :hasPendingChanges="() => false"
    is-data-available
    persistent
    no-header
    :maxWidth="480"
  >
    <div class="q-mb-md text-center text-h6 line-height-15">
      <q-icon name="warning" />
      {{ $t("passwordSecurityWarningTitle") }}
    </div>
    <div>
      <simplified-markdown :text="$t('passwordSecurityWarning')" />
    </div>
    <div>
      <q-checkbox 
        v-model="confirmed" 
        :label="$t('passwordSecurityCheckbox')"
        class="q-mt-md"
      />
    </div>
    <q-btn
      :label="$t('continue')"
      :disabled="!confirmed"
      type="submit"
      no-caps
      rounded
      color="primary-gradient"
      class="full-width q-mt-md"
      @click.prevent="onDone"
    />
  </editing-sheet>
</template>

<script setup lang="ts">
import { Ref, ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import EditingSheet from "src/components/EditingSheet.vue";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();
const editingSheetRef = dialogRef as Ref<InstanceType<typeof EditingSheet> | undefined>;

const confirmed = ref(false);

function onDone() {
  editingSheetRef.value?.confirm();
  emit("ok");
}

</script>