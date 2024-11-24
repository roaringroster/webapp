<template>
  <q-dialog
    v-model="visible"
    position="bottom"
    :persistent="persistent"
    no-route-dismiss
    full-height
    :backdrop-filter="$q.screen.gt.xs ? 'blur(1px)' : ''"
    class="editing-sheet"
    @hide="onHide"
    @before-show="onBeforeShow"
    @before-hide="onBeforeHide"
  >
    <q-card
      ref="card"
      class="sheet no-scroll"
      :style="`width: 100%; max-width: ${safeMaxWidth}px;`"
    >
      <q-card-section
        :class="['sheet-header row no-wrap items-center non-selectable no-scroll', headerClass]"
        style="min-height: 44px"
      >
        <q-btn
          v-if="!persistent && !hasCloseButton"
          :label="$t('cancel')"
          flat
          rounded
          dense
          no-caps
          color="primary"
          class="q-px-sm"
          v-close-popup
        />
        <div
          v-else
          style="width: 32px"
        ></div>
        <div class="col text-center">
          <div 
            v-if="title"
            :class="['text-h5 sheet-title', !subtitle ? 'no-subtitle' : '']"
          >
            <simplified-markdown :text="title"/>
          </div>
          <div 
            v-if="subtitle"
            class="text-body2 sheet-subtitle"
          >
            <simplified-markdown :text="subtitle" bold-class="text-weight-medium"/>
          </div>
        </div>
        <q-btn
          v-if="hasCloseButton"
          icon="fas fa-close"
          :title="$t('cancel')"
          flat
          round
          dense
          color="primary"
          v-close-popup
          @click.stop
        />
        <q-btn
          v-else-if="hasDoneButton"
          :label="doneButtonLabel || $t('done')"
          :disable="doneButtonDisable"
          flat
          rounded
          dense
          no-caps
          color="primary"
          class="q-px-sm text-bold"
          @click="$emit('ok')"
        />
        <div
          v-else
          style="width: 32px"
        ></div>
      </q-card-section>
      <q-card-section
        style="height: calc(100% - 44px)" 
        :class="[
          contentClass, 
          $q.screen.lt.sm ? xsContentClass : ''
        ]"
      >
        <div v-if="!isDataAvailable">{{ $t("noData") }}</div>
        <slot v-else />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style lang="sass">
.editing-sheet > .q-dialog__inner
  height: calc(100% - 18px)
  .sheet-header
    padding: 6px 2px 4px
    @media (max-width: $breakpoint-xs-max)
      padding: 4px 0 2px
  .sheet-title, .sheet-subtitle
    color: #333333
    &> *
      display: -webkit-box
      white-space: nowrap
      -webkit-box-orient: vertical
      overflow: hidden
      text-overflow: ellipsis
  .sheet-title
    // max-height: 32px
    // 1rem == 16px
    // maxWidth = 40rem (== 640px or $breakpoint-xs-max + 40px)
    // minWidth == 25rem (== 400px)
    // maxFontSize = 1.125rem (== 18px)
    // minFontSize = .875rem (== 14px)
    // slope = (maxFontSize - minFontSize) / (maxWidth - minWidth)
    // yAxisIntersection = -minWidth * slope + minFontSize
    // preferredValue = yAxisIntersection[rem] + (slope * 100)[vw]
    font-size: clamp(.875rem, .458rem + 1.667vw, 1.125rem)
    line-height: 1.2em
    font-weight: 500
    @media (max-width: $breakpoint-xs-max)
      &.no-subtitle > *
        white-space: normal
        -webkit-line-clamp: 2
  .sheet-subtitle
    font-size: .8125rem
.sheet
  border-top-left-radius: 8px !important
  border-top-right-radius: 8px !important
@media screen and (max-width: $breakpoint-xs-max)
  .presenting-sheet-transition:not(.electron)
    background-color: #000000
    #q-app > :first-child
      overflow: hidden
      transition-property: transform, translate, border-top-left-radius, border-top-right-radius
      transition-duration: 300ms
      transform-origin: top center
  .presenting-sheet:not(.electron) #q-app > :first-child
    border-top-left-radius: 9px !important
    border-top-right-radius: 9px !important
    transform: scale(0.9) translateY(10px)
  .presenting-sheet.q-ios-padding #q-app > :first-child
    transform: scale(0.9) translateY(30px)
.electron .editing-sheet > .q-dialog__inner
  height: calc(100% - 28px)
// crazy workaround for select menus that are displayed above the select box, with the aim to keep the topmost select option selectable on mobile (iOS) devices by moving the menu slightly down from the top edge of the screen
// the workaround can be removed, as soon as we find a different way of preventing a QMenu of a QSelect to render (partially) outside the bounding box of an EditingSheet, e.g. by programmatically adjusting the height, top position or some other css magic
.presenting-sheet > * > .q-menu[style*="top: 0px"]
  top: 10px !important
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
  @Prop({ type: String, default: ""}) readonly subtitle!: string;
  @Prop({ type: Array, default: () => []}) readonly paramsToRemoveOnClose!: string[];
  @Prop({ type: Boolean, default: false }) readonly hasDoneButton!: boolean;
  @Prop({ type: String, default: ""}) readonly doneButtonLabel!: string;
  @Prop({ type: Boolean, default: false}) readonly doneButtonDisable!: boolean;
  @Prop({ type: Boolean, default: false }) readonly hasCloseButton!: boolean;
  @Prop({ type: Boolean, default: false }) readonly persistent!: boolean;
  @Prop({ type: Number, default: 900 }) readonly maxWidth!: number;
  @Prop({ type: String, default: "border-bottom-grey"}) readonly headerClass!: string;
  @Prop({ type: String, default: "q-mt-sm q-pb-lg scroll"}) readonly contentClass!: string;
  @Prop({ type: String, default: "q-px-sm"}) readonly xsContentClass!: string;

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
  
  get safeMaxWidth() {
    return Math.max(this.maxWidth, 600);
  }

  onBeforeShow() {
    const scrollTop = document.body.parentElement?.scrollTop || 0;
    const element = document.querySelector("#q-app") as HTMLElement | null;
    document.body.classList.add("presenting-sheet");
    document.body.classList.add("presenting-sheet-transition");

    if (element && scrollTop != 0) {
      element.style.translate = `0 ${scrollTop}px`;
    }
  }

  onBeforeHide() {
    document.body.classList.remove("presenting-sheet");
    const element = document.querySelector("#q-app") as HTMLElement | null;

    if (element) {
      element.style.translate = "";
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

    document.body.classList.remove("presenting-sheet-transition");
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
