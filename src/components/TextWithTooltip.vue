<template>
  <div :class="!!tooltip ? 'cursor-help' : ''">
    <simplified-markdown :text="text" />
    <q-icon
      v-if="tooltip"
      name="fas fa-info-circle"
      size=".85rem"
      :class="[!iconClass.includes('q-ml-') ? 'q-ml-xs' : '', iconClass]"
      style="vertical-align: baseline"
    />
    <q-tooltip
      :offset="$q.platform.is.mobile ? [0,10] : [0,4]"
      v-if="tooltip"
      :target="target"
      :max-width="maxWidth"
      :anchor="(top || $q.platform.is.mobile ? 'top middle' : 'bottom middle')"
      :self="(top || $q.platform.is.mobile ? 'bottom middle' : 'top middle')"
      class="text-center"
      style="font-size: 0.8rem"
    >
      <simplified-markdown :text="tooltip" />
    </q-tooltip>
    <slot/>
    <q-resize-observer @resize="parentWidth = $event.width + 'px'" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-facing-decorator";
import SimplifiedMarkdown from "./SimplifiedMarkdown.vue";

@Component({
  components: {
    SimplifiedMarkdown
  }
})
export default class TextWithTooltip extends Vue {
  @Prop({ type: String, default: ""}) readonly text!: string;
  @Prop({ type: String, default: ""}) readonly tooltip!: string;
  @Prop({ type: String, default: ""}) readonly width!: string;
  @Prop({ type: String, default: ""}) readonly iconClass!: string;
  @Prop({ type: Boolean }) readonly top!: boolean;
  @Prop({ type: [Boolean, String, Object], default: true }) readonly target!: boolean | string | Element;

  parentWidth = "100%";

  get maxWidth() {
    return this.width || this.parentWidth;
  }
}
</script>