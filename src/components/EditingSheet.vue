<template>
  <q-dialog
    v-model="visible"
    position="bottom"
    :persistent="persistent"
    no-route-dismiss
    full-height
    id="modal-presentation"
    @hide="onHide"
  >
    <q-card
      ref="card"
      class="no-scroll"
      :style="`width: 100%; max-width: ${maxWidth}px;`"
    >
      <q-card-section
        class="q-px-xs q-pt-sm q-pb-xs row no-wrap items-center border-bottom-grey non-selectable no-scroll"
        style="height: 44px"
      >
        <q-btn
          v-if="!persistent"
          :label="$t('cancel')"
          flat
          rounded
          dense
          no-caps
          color="primary"
          class="q-px-xs"
          v-close-popup
        />
        <div
          v-else
          style="width: 50px"
        ></div>
        <div class="col text-h5 text-center sheet-title">
          <simplified-markdown
            v-if="title"
            :text="title"
          />
        </div>
        <q-btn
          v-if="hasDoneButton"
          :label="doneButtonLabel || $t('done')"
          :disable="doneButtonDisable"
          flat
          rounded
          dense
          no-caps
          color="primary"
          class="q-px-xs text-bold"
          @click="$emit('ok')"
        />
        <div
          v-else
          style="width: 50px"
        ></div>
      </q-card-section>
      <q-card-section
        style="height: calc(100% - 42px)" 
        class="scroll modal-view-section q-mt-sm q-pb-lg"
      >
        <div v-if="!isDataAvailable">{{ $t("noData") }}</div>
        <slot v-else />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style lang="sass">
#modal-presentation > .q-dialog__inner
  height: calc(100% - 28px)
  .modal-view-section
    @media (max-width: $breakpoint-xs-max)
      padding-left: 8px
      padding-right: 8px
  .sheet-title
    max-height: 32px
    font-size: 1.2rem
    line-height: 1.5rem
    &> *
      display: -webkit-box
      -webkit-line-clamp: 1
      -webkit-box-orient: vertical
      overflow: hidden
      text-overflow: ellipsis
    @media (max-width: $breakpoint-xs-max)
      font-size: .8rem
      line-height: 1.1rem
      &> *
        -webkit-line-clamp: 2
</style>

<script lang="ts">
import { Component, Prop, Ref, Vue } from "vue-facing-decorator";
import { RouteLocationRaw } from "vue-router";
import { QCard } from "quasar";
import { showWarning } from "src/helper/warning";
import SimplifiedMarkdown from "components/SimplifiedMarkdown.vue";

export type DoneButton = {
  label?: string;
  action: () => void;
  disable?: boolean;
};

@Component({
  components: {
    SimplifiedMarkdown
  },
  emits: ["ok", "hide"]
})
class EditingSheet extends Vue {
  @Ref() readonly card?: QCard;
  @Prop({ type: Boolean }) readonly isDataAvailable!: boolean;
  @Prop({ type: Boolean, default: true }) readonly isInitiallyVisible!: boolean;
  @Prop({ type: Function, default: () => false }) readonly hasPendingChanges!: () => boolean;
  @Prop({ type: String, default: ""}) readonly title!: string;
  @Prop({ type: Array, default: () => []}) readonly paramsToRemoveOnClose!: string[];
  @Prop({ type: Boolean, default: false }) readonly hasDoneButton!: boolean;
  @Prop({ type: String, default: ""}) readonly doneButtonLabel!: string;
  @Prop({ type: Boolean, default: false}) readonly doneButtonDisable!: boolean;
  @Prop({ type: Boolean, default: false }) readonly persistent!: boolean;
  @Prop({ type: Number, default: 900 }) readonly maxWidth!: number;

  private isVisible = this.isInitiallyVisible;
  private locationOnClose: RouteLocationRaw | null = null;

  get visible() {
    return this.isVisible;
  }
  set visible(value: boolean) {
    if (value || !this.hasPendingChanges()) {
      this.isVisible = value;
    } else {
      showWarning(
        this.$t("unsavedChangesMessage") as string,
        this.$t("unsavedChangesTitle") as string
      ).onOk(() => this.isVisible = value);
    }
  }

  async onHide() {
    const params = {...this.$route.params};
    ["sheet"].concat(this.paramsToRemoveOnClose)
      .forEach(key => delete params[key]);

    if (JSON.stringify(params) != JSON.stringify(this.$route.params)) {
      await this.$router.replace({
        name: this.$route.name || "",
        params
      });
    }

    if (this.locationOnClose) {
      void this.$router.replace(this.locationOnClose);
    }

    this.$emit("hide");
  }

  cancel(toLocation?: RouteLocationRaw) {
    this.locationOnClose = toLocation ?? null;
    this.hide();
  }

  confirm(toLocation?: RouteLocationRaw) {
    this.locationOnClose = toLocation ?? null;
    this.isVisible = false; // bypass setter that shows warning
  }

  /** 
   * Workaround for a bug where the QCard is scrolled (programmatically?) 10px up 
   * when new elements become visible through user interaction, although the QCard should
   * not be scrollable, causing the header section to be only partially visible.
   */
  preventScrollingCard() {
    const element = this.card?.$el as HTMLElement | undefined;

    if (!!element && element.scrollTop > 0) {
      element.scrollTop = 0;
    }
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  mounted() {
    setTimeout(() => this.card?.$el?.addEventListener("scroll", this.preventScrollingCard));
  }

  unmounted() {
    this.card?.$el?.removeEventListener("scroll", this.preventScrollingCard);
  }

}

export default EditingSheet;
</script>
