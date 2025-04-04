<template>
  <q-input
    v-model="dateString"
    @blur="onBlurInput()"
    :key="dateKey"
    :mask="dateMaskForInput"
    fill-mask
    :label="label"
    :placeholder="placeholder"
    :color="color"
    :dense="dense"
    :hint="hint"
    ref="dateInput"
    inputmode="numeric"
    class="date-time-input"
  >
    <q-menu
      ref="menu"
      v-if="mappedOptions"
      v-model="showOptions"
      auto-close
      fit
      anchor="bottom left"
      self="top left"
      square
      no-focus
    >
      <q-list dense>
        <q-item
          v-for="option in mappedOptions"
          :key="option.value()"
          clickable
          @focus="onBlurInput(() => selectOption(option))"
          @click="selectOption(option)"
          :active="dateString == option.value()"
          :active-class="'text-' + color"
        >
          <q-item-section>{{ option.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <template v-slot:prepend>
      <q-icon
        v-if="showDatePicker"
        name="event"
        class="cursor-pointer"
        :color="color"
        @click.stop.prevent="showDateProxy"
      >
        <q-popup-proxy
          ref="dateProxy"
          transition-show="scale"
          transition-hide="scale"
          self="center middle"
        >
          <q-date
            v-model="dateString"
            :mask="format"
            :color="color"
            @update:model-value="onInputDate"
            today-btn
            :options="dateOptions"
            :first-day-of-week="firstDayOfWeek"
          />
        </q-popup-proxy>
      </q-icon>
      <q-icon
        v-if="!showDatePicker && showTimePicker"
        name="access_time"
        class="cursor-pointer"
        :color="color"
        @click.stop.prevent="showTimeProxy"
      >
        <q-popup-proxy
          ref="timeProxy"
          transition-show="scale"
          transition-hide="scale"
          self="center middle"
          @before-hide="onBeforeHideTimeProxy"
        >
          <q-time
            :model-value="dateString"
            @update:model-value="temporaryDateString = $event"
            :mask="format"
            :color="color"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                :label="$t('done')"
                :color="color"
                flat
                rounded
                no-caps
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>

    <template v-slot:append>
      <q-icon
        v-if="!required && dateString"
        name="cancel"
        @click.stop.prevent="clear"
        class="cursor-pointer text-grey-6"
      />
      <q-icon
        v-if="showTimePicker && showDatePicker"
        name="access_time"
        class="cursor-pointer"
        :color="color"
        @click.stop.prevent="showTimeProxy"
      >
        <q-popup-proxy
          ref="timeProxy"
          transition-show="scale"
          transition-hide="scale"
          self="center middle"
          @before-hide="onBeforeHideTimeProxy"
        >
          <q-time
            :model-value="dateString"
            @update:model-value="temporaryDateString = $event"
            :mask="format"
            :color="color"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                :label="$t('done')"
                :color="color"
                flat
                rounded
                no-caps
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<style lang="sass">
.date-time-input
  .q-field__before, .q-field__after
    border-bottom: 1px solid rgba(0, 0, 0, 0.24)
</style>

<script lang="ts">
import { Vue, Component, Prop, Ref, Model } from "vue-facing-decorator";
import { date, QInput, QMenu, QPopupProxy } from "quasar";

// const emptyDate = new Date(0, 0, 1, 0, 0, 0, 0).getTime();

interface DateSelectionOption {
  label: string;
  value: () => Date;
}

@Component({
  emits: ["update:model-value"]
})
export default class DateTimeInput extends Vue {
  @Model({ type: Date }) readonly value: Date | null | undefined;
  @Prop({ type: String, default: "YYYY-MM-DD HH:mm"}) readonly format!: string;
  @Prop({ type: Date }) readonly min: Date | undefined;
  @Prop({ type: String }) readonly label: string | undefined;
  @Prop({ type: String }) readonly placeholder: string | undefined;
  @Prop({ type: String }) readonly defaultTime: string | undefined;
  @Prop({ type: String, default: "primary"}) readonly color!: string;
  @Prop({ type: Boolean }) readonly required!: boolean;
  @Prop({ type: Boolean }) readonly dense!: boolean;
  @Prop({ type: Array, default: () => []}) readonly options!: DateSelectionOption[];
  @Prop({ type: String }) readonly hint: string | undefined;
  @Prop({ type: [String, Number], default: 0 }) readonly firstDayOfWeek?: string | number;
  @Ref() readonly dateInput!: QInput;
  @Ref() readonly dateProxy!: QPopupProxy;
  @Ref() readonly timeProxy!: QPopupProxy;
  @Ref() readonly menu!: QMenu;

  dateKey = Math.random();
  showOptions = false;
  temporaryDateString: string | null = null;

  get dateString(): string {
    return date.formatDate(this.value || undefined, this.format) || "";
  }
  set dateString(value: string) {
    const result = date.extractDate(value, this.format);

    if (!!value && !value.includes("_") && !isNaN(result.getTime()) /* && result.getTime() != emptyDate */) { // comparing with empty date means that 1900-01-01 or 00:00 or both combined cannot be entered – but why was the check added?
      if (
        !this.min ||
        date.isBetweenDates(result, this.min, result, {
          inclusiveTo: true,
          inclusiveFrom: true,
          onlyDate: true
        })
      ) {
        this.$emit("update:model-value", result);
      } else {
        this.$emit(
          "update:model-value",
          new Date(
            new Date(this.min).setHours(
              result.getHours(),
              result.getMinutes(),
              result.getSeconds(),
              result.getMilliseconds()
            )
          )
        );
      }
    } else {
      if (value == this.dateMaskAsValue && !this.required) {
        this.$emit("update:model-value", null)
      } else {
        // do nothing because the input is having an inconsistent string value which is currently edited
      }
    }
  }
  get dateMaskForInput() {
    return this.format
      .toString()
      .replace(/[dDMYHhm]/g, "#")
      .replace(/A/g, "AA");
  }
  get dateMaskAsValue() {
    return this.dateMaskForInput.replace(/[#A]/g, "_")
  }
  get showDatePicker() {
    return /[YMDd]/.test(this.format);
  }
  get showTimePicker() {
    return /[hHmaA]/.test(this.format);
  }
  get mappedOptions() {
    return this.options
      ?.sort((a: any, b: any) => a.value().getTime() - b.value().getTime())
      .map((option: any) => {
        return {
          label: option.label,
          value: () => date.formatDate(option.value(), this.format)
        };
      });
  }

  dateOptions(value: string) {
    return !this.min || value >= date.formatDate(this.min, "YYYY/MM/DD");
  }

  onInputDate(value: string) {
    if (!this.dateString && this.defaultTime) {
      this.dateString = value.replace("00:00", this.defaultTime);
    }
    this.dateProxy.hide();
  }

  clear(event: Event) {
    this.$emit("update:model-value", null);
    this.dateInput.$emit("blur", event);
    this.showOptions = false;
  }

  onBlurInput(next?: (() => void)) {
    if (this.dateInput?.nativeEl.value != this.dateString) {
      this.autocompleteTimeIfNeeded();
      this.dateKey = Math.random();
      next?.()
    }
  }

  /**
   * Supports only `HH:mm` time format and is not applied to others (e.g. AM/PM time format: `hh:mm AA`).
   */
  autocompleteTimeIfNeeded() {
    if (this.value == undefined && this.format == "HH:mm") {
      let numbers = this.dateInput?.nativeEl.value.replace(/\D/g, "");

      if (numbers.length == 1) {
        numbers = "0" + numbers + "00"
      } else if (numbers.length == 2) {
        numbers = numbers + "00"
      } else if (numbers.length == 3) {
        numbers = "0" + numbers
      } else {
        return;
      }

      const hours = numbers.substring(0, 2)
      const minutes = numbers.substring(2, 4)

      if (parseInt(hours) < 24 && parseInt(minutes) < 60) {
        this.dateString = hours + ":" + minutes;
      }
    }
  }

  selectOption(option: {value: () => string}) {
    this.dateString = option.value();
    this.showOptions = false;
    setTimeout(() => this.dateInput.focus());
  }

  showDateProxy() {
    this.showOptions = false;
    this.onBlurInput(() => setTimeout(() => this.dateProxy.show()));
  }

  showTimeProxy() {
    this.showOptions = false;
    this.onBlurInput(() => setTimeout(() => this.timeProxy.show()));
  }

  onBeforeHideTimeProxy() {
    if (!!this.temporaryDateString && this.temporaryDateString != this.dateString) {
      this.dateString = this.temporaryDateString;
      this.temporaryDateString = null;
    }
  }

  onDidChangeLocale() {
    this.dateKey = Math.random();
  }

  focus() {
    this.dateInput?.focus();
  }

  created() {
    this.$bus.on("did-change-locale", this.onDidChangeLocale);
  }

  unmounted() {
    this.$bus.off("did-change-locale", this.onDidChangeLocale);
  }
}
</script>
