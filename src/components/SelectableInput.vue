<template>
  <q-select
    :model-value="value"
    :label="label"
    :options="filteredOptions"
    :map-options="mapOptions"
    emit-value
    :behavior="behavior"
    :dense="dense"
    :options-dense="optionsDense"
    use-input
    type="text"
    hide-selected
    fill-input
    input-debounce="0"
    :clearable="clearable"
    :hide-dropdown-icon="hideDropdownIcon || readOnly"
    :readonly="readOnly"
    :borderless="readOnly"
    :bottom-slots="!!hint"
    @update:model-value="$emit('update:model-value', $event || '')"
    @input-value="inputValue = $event;"
    @keydown.enter.tab="selectInputValue"
    @keydown.tab="lastTabKeyDownTimestamp = Date.now()"
    @focus="onFocus"
    @blur="onBlur"
    @filter="filter"
    @popup-show="select.reset()"
    ref="select"
  >
    <template v-slot:option="scope">
      <q-item
        v-bind="scope.itemProps"
        :disable="scope.opt.disable"
      >
        <q-item-section
          v-if="scope.opt.icon"
          side
          class="q-pr-xs"
        >
          <q-icon
            :name="scope.opt.icon"
            color="text-grey-10"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label
            caption
            lines="1"
          >{{ scope.opt.description }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-slot:hint>
      <q-item-label 
        :lines="hintLines"
        style="line-height: 1em !important"
      >{{ hint }}</q-item-label>
    </template>
    <template v-if="$slots.prepend" v-slot:prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" v-slot:append>
      <slot name="append" />
    </template>
    <template v-if="$slots.before" v-slot:before>
      <slot name="before" />
    </template>
    <template v-if="$slots.after" v-slot:after>
      <slot name="after" />
    </template>
  </q-select>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref, Model } from "vue-facing-decorator";
import { QSelect } from "quasar";
import { selectBehavior } from "src/helper/utils";

type SelectableInputOptions = {
  label: string;
  value: any;
  description?: string;
  disable?: boolean;
}

@Component({
  emits: ["update:model-value", "new-value"]
})
export default class SelectableInput extends Vue {
  @Model() readonly value!: any;
  @Prop({ type: String, default: "" }) readonly label!: string;
  @Prop({ type: Array, default: () => [] }) readonly options!: SelectableInputOptions[];
  @Prop({ type: Boolean }) readonly dense!: boolean;
  @Prop({ type: Boolean, default: true }) readonly optionsDense!: boolean;
  @Prop({ type: Boolean }) readonly clearable!: boolean;
  @Prop({ type: Boolean }) readonly hideDropdownIcon!: boolean;
  @Prop({ type: Boolean }) readonly noNewValue!: boolean;
  @Prop({ type: Boolean, default: true }) readonly mapOptions!: boolean;
  @Prop({ type: String }) readonly hint?: string;
  @Prop({ type: Number, default: 0 }) readonly hintLines!: number;
  @Prop({ type: Boolean }) readonly readOnly!: boolean;
  @Ref() readonly select!: QSelect;

  filteredOptions: SelectableInputOptions[] = [];
  lastTabKeyDownTimestamp = 0;
  inputValue = "";

  get behavior() {
    return selectBehavior();
  }

  onFocus() {
    const selection = window.getSelection();

    // If we don't have a selection, collapseToEnd will throw an InvalidStateError.
    // We don't have a selection when the select receives focus from a tap on the triangle icon.
    if (selection && selection.rangeCount > 0) {
      selection.collapseToEnd();
    }
  }
  onBlur() {
    if (this.lastTabKeyDownTimestamp + 100 < Date.now()) {
      this.selectInputValue();
    }
  }
  selectInputValue() {
    const value = this.inputValue.trim();
    const needle = value.toLocaleLowerCase();
    const existingOption = this.options.find(option => 
      option.label.toLocaleLowerCase() == needle || option.value == value
    );

    if (!existingOption) {
      this.filteredOptions = this.options;

      if (!this.noNewValue) {
        this.$emit("update:model-value", value);
        this.$emit("new-value", value);
      }
    } else if (existingOption.value != this.value) {
      this.filteredOptions = this.options;
      this.$emit("update:model-value", existingOption.value);
    }
  }
  filter(value: string, update: (_: () => void) => void) {
    update(() => {
      const needle = value.toLocaleLowerCase()
      this.filteredOptions = this.options.filter(item => 
        [item.label, item.description || ""].join(" ").toLocaleLowerCase().indexOf(needle) > -1
      );
    })
  }
  blur() {
    this.select.blur();
  }
  mounted() {
    // if filteredOptions is not initialized with the list of options, 
    // map-options and emit-value will not work initially
    this.filteredOptions = this.options;
  }
}
</script>