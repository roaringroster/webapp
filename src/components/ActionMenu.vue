<template>
  <q-btn-dropdown
    v-if="items.filter(item => item.condition !== false).length"
    :color="color"
    :label="showTitle ? title : undefined"
    rounded
    :outline="!flat"
    :flat="flat"
    size="14px"
    no-caps
    dense
    :class="['more-button bg-white', !flat ? 'shadow-1' : '']"
    auto-close
    :content-class="'radius-md shadow-5 text-' + color"
    :title="title || $t('moreActions')"
  >
    <q-list ref="list" class="print-hide">
      <div
        v-for="(item, index) in sortedItems"
        :key="index"
      >
        <slot
          v-if="item.customType"
          :name="item.customType"
        />
        <q-separator v-else-if="item.name == '-'" />
        <q-item
          v-else
          clickable
          v-ripple
          :disabled="item.disabled || undefined"
          @click="!item.disabled ? item.action() : () => {}"
          :class="item.isDestructive ? 'text-negative' : ''"
        >
          <q-item-section v-if="!hideIcons" side>
            <q-icon
              :name="item.icon"
              :color="item.isDestructive ? 'negative': color"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.name }}</q-item-label>
            <q-item-label 
              v-if="item.caption" 
              caption
              :class="['text-italic', item.isDestructive ? 'text-negative' : '']"
            >
              {{ item.caption }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-list>
  </q-btn-dropdown>
</template>

<style lang="sass">
.more-button.q-btn-dropdown .q-btn-dropdown__arrow
  margin: 0
</style>
<script lang="ts">
import { Vue, Component, Prop, Ref, Watch } from "vue-facing-decorator";
import { QList, QMenu } from "quasar";

export interface ActionItem  {
  name: string;
  caption?: string;
  icon?: string;
  action: () => void;
  condition?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
  customType?: string;
}

@Component
export default class ActionMenu extends Vue {
  @Prop({ type: String, default: ""}) readonly title!: string;
  @Prop({ type: Array, default: () => [] }) readonly items!: ActionItem[];
  @Prop({ type: String, default: "primary" }) readonly color!: string;
  @Prop({ type: Boolean }) readonly showTitle!: boolean;
  @Prop({ type: Boolean }) readonly flat!: boolean;
  @Prop({ type: Boolean }) readonly hideIcons!: boolean;
  @Ref() readonly list!: QList;

  @Watch("items")
  onItemsChange() {
    // only if the action menu is visible
    if (this.list && this.list.$parent) {
      let parent: any = this.list.$parent;

      // as we don't have access to QMenu directly we traverse the graph upwards from 
      // what we have to find QMenu
      while (!!parent && !(parent as QMenu)?.updatePosition) {
        parent = parent.$parent;
      }

      if (parent) {
        // waiting for new list items to be rendered with their dimensions 
        // before updating the position
        setTimeout(() => (parent as QMenu)?.updatePosition?.());
      }
    }
  }

  get sortedItems() {
    return this.items
      .filter(item => item.condition !== false)
      .sort((a, b) => Number(a.isDestructive || false) - Number(b.isDestructive || false))
  }
}
</script>
