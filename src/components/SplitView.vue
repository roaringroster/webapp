<template>
  <q-splitter
    v-model="splitValue"
    :limits="limits"
    :separator-class="!isCollapsed ? '' : 'hidden'"
    before-class="overflow-hidden"
    after-class="overflow-hidden"
    class="split-view"
  >
    <q-resize-observer @resize="onResize" />
    <template v-slot:before>
      <div ref="beforeContainer">
        <slot name="before" />
      </div>
    </template>

    <template v-slot:after>
      <div
        ref="afterContainer"
        :class="[isCollapsed ? 'q-px-xs' : 'q-pl-md', 'p-pa-none']"
      >
        <slot name="after" />
        <q-btn
          v-if="isCollapsed"
          flat
          round
          color="primary"
          icon="fas fa-chevron-left"
          size="13.5px"
          dense
          class="absolute-top-left"
          @click="showBefore"/>
      </div>
    </template>
  </q-splitter>
</template>

<style lang="sass">
.split-view
  @media print
    .q-splitter__separator
      display: none
    .q-splitter__before
      width: 0 !important
</style>

<script lang="ts">
import { Vue, Component, Prop, Ref } from "vue-facing-decorator";

@Component({
  emits: ["update:is-collapsed", "did-show-before", "did-show-after"]
})
export default class SplitView extends Vue {
  @Prop({ type: Number, default: 300 }) readonly minSlotWidth!: number;
  @Prop({ type: Number, default: 0 }) readonly scrollOffsetTop!: number;
  @Ref() readonly beforeContainer!: HTMLElement;
  @Ref() readonly afterContainer!: HTMLElement;

  splitValue = 35;
  isCollapsed = false;
  isBeforeVisible = true;
  width = Infinity;

  get limits() {
    if (this.isCollapsed) {
      return [0, 100];
    } else {
      return [this.minWidthInPercent, 100 - this.minWidthInPercent];
    }
  }
  get minWidthInPercent() {
    return Math.round(this.minSlotWidth * 100 / this.width);
  }

  onResize() {
    this.width = (this.$el as HTMLElement).offsetWidth;
    const wasCollapsed = this.isCollapsed;
    this.isCollapsed = this.width <= this.minSlotWidth * 2;
    this.showVisible(false);

    if (wasCollapsed != this.isCollapsed) {
      this.$emit("update:is-collapsed", this.isCollapsed);
    }
  }
  showVisible(animate: boolean) {
    if (this.isCollapsed) {
      const to = this.isBeforeVisible ? 100 : 0;

      if (animate) {
        const from = this.splitValue;
        const easing: (t: number) => number = t => t*(2-t);

        const eventName = this.isBeforeVisible ? "did-show-before" : "did-show-after";
        const containers = [this.beforeContainer, this.afterContainer];
        const width = Math.max(this.beforeContainer.offsetWidth, this.afterContainer.offsetWidth);
        containers.forEach(element => element.style.width = width + "px");

        this.animate(from, to, 200, easing, value => {
          this.splitValue = value;
          
          if (value == to) {
            containers.forEach(element => element.style.removeProperty("width"));
            this.$emit(eventName);
          }
        });
      } else {
        this.splitValue = to;
      }
    }
  }
  showBefore() {
    this.isBeforeVisible = true;
    this.showVisible(true);
  }
  showAfter(animate = true) {
    this.isBeforeVisible = false;
    this.showVisible(animate);

    const scrollTop = (this.$el?.getBoundingClientRect().top || 0) + window.pageYOffset + this.scrollOffsetTop;

    if (window.pageYOffset > scrollTop) {
      window.scrollTo({
        top: scrollTop
      });
    }
  }
  animate(from: number, to: number, duration: number, easing: (progress: number) => number = t => t,  handler: (value: number) => void) {
    let start: DOMHighResTimeStamp;
    const diff = to - from;

    function step(timestamp: DOMHighResTimeStamp) {
      if (start === undefined) {
        start = timestamp;
      }
      
      const elapsed = timestamp - start;

      if (elapsed < duration) {
        handler(from + diff * easing(elapsed / duration));
        window.requestAnimationFrame(step);
      } else {
        handler(to);
      }
    }
    
    window.requestAnimationFrame(step);
  }

  mounted() {
    this.onResize();

    if (!this.isCollapsed) {
      this.splitValue = this.minWidthInPercent;
    }
  }
}
</script>
