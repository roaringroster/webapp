<template>
  <q-dialog ref="dialog">
    <q-card class="q-dialog-plugin">
      <q-card-section v-if="title">
        <div class="text-h6">{{ title }}</div>
      </q-card-section>

      <q-card-section v-if="message">
        <div class="text-body2">{{ message }}</div>
      </q-card-section>

      <q-card-section>
        <q-select 
          v-model="selection"
          :label="label"
          :options="selectOptions"
          emit-value
          :behavior="behavior"
          map-options
        />
      </q-card-section>

      <q-card-actions class="justify-end">
        <q-btn
          :label="$t('cancel')"
          color="primary"
          no-caps
          flat
          rounded
          @click="hide"
        />
        <q-btn
          v-for="(label, buttonIndex) in otherButtonLabels"
          :key="buttonIndex"
          :label="label"
          color="primary"
          no-caps
          flat
          rounded
          @click="hide(); $emit('ok', {selection, buttonIndex});"
        />
        <q-btn
          :label="okButtonLabel || $t('OK')"
          color="primary"
          no-caps
          flat
          rounded
          @click="hide(); $emit('ok', otherButtonLabels.length ? {selection, buttonIndex: otherButtonLabels.length} : selection);"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from "vue-facing-decorator";
import { QDialog } from "quasar";
import { selectBehavior } from "src/helper/utils";

@Component({
  emits: ["ok", "hide"]
})
export default class SelectDialog extends Vue {
  @Prop({type: String, default: ""}) readonly title!: string;
  @Prop({type: String, default: ""}) readonly message!: string;
  @Prop({type: String, default: ""}) readonly label!: string;
  @Prop({type: String}) readonly okButtonLabel?: string;
  @Prop({type: Array, default: () => []}) readonly otherButtonLabels!: string[];
  @Prop({type: Array, default: () => []}) readonly selectOptions!: {label: string, value: string}[];
  @Ref() readonly dialog!: QDialog;

  selection = "";

  get behavior() {
    return selectBehavior();
  }

  show () {
    this.dialog.show();
  }
  hide () {
    this.dialog.hide();
  }

  mounted() {
    this.selection = this.selectOptions[0]?.value || "";
  }
}
</script>
