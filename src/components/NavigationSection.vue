<template>
  <q-item
    v-for="item in items.filter(item => item.visible != false)"
    :key="item.label"
    clickable
    v-ripple
    active-class="text-primary active-hover-background"
    :active="isActive(item)"
    :class="itemClass"
    @click="item.action ? item.action() : route(item.route, item.params)"
  >
    <q-item-section side>
      <q-icon
        :name="item.icon"
        :color="isActive(item) ? 'primary' : undefined"
      />
    </q-item-section>
    <q-item-section>{{ item.label }}</q-item-section>
  </q-item>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-facing-decorator";

export type NavigationItem = {
  label: string;
  icon: string;
  route?: string;
  params?: Record<string, string>;
  action?: () => void;
  active?: boolean;
  visible?: boolean;
}

@Component
export default class NavigationSection extends Vue {
  @Prop({type: Array, default: () => []}) readonly items!: NavigationItem[];
  @Prop({type: String, default: ""}) readonly itemClass!: string;

  isActive(item: NavigationItem) {
    return item.active || (!!item.route && !!this.$route.matched.find(route => route.name == item.route));
  }

  route(routeName?: string, params?: Record<string, string>) {
    if (!!routeName && this.$route.name != routeName) {
      this.$router.push({ name: routeName, params })
        .catch(console.error)
    }
  }
}
</script>
