<template>
  <q-layout view="hHh Lpr lff">
    <q-header class="bg-white print-hide">
      <q-toolbar
        :class="'shadow-3 bg-primary ' + ($q.screen.lt.sm ? 'q-px-none' : '')"
        style="z-index: 1000"
      >
        <q-btn
          v-if="hasBackButton"
          size="lg"
          dense
          no-caps
          flat
          icon="chevron_left"
          :ripple="false"
          @click="$router.back()"
        />
        <div 
          style="width: 86px"
        ></div>

        <q-toolbar-title class="text-center">
          <div
            class="ellipsis title-text"
          >
            {{ title }}
          </div>
        </q-toolbar-title>

        <q-btn
          :label="$i18n.locale.split('-')[0]"
          icon="fas fa-globe"
          stretch
          flat
          class="hide-arrow"
        >
          <language-menu />
        </q-btn>
      </q-toolbar>
      <banner />
      <div
        class="absolute-full overflow-hidden no-pointer-events"
        style="bottom: -10px"
      ></div>
    </q-header>

    
    <q-page-container>
      <div class="print-only text-black text-center text-subtitle2 border-bottom-grey">
        {{ title }}
      </div>
      <router-view v-slot="{ Component, route }">
        <transition
          :name="route.meta.transition"
          @enter="isTransitioning = !!route.meta.transition"
          @leave="isTransitioning = false"
        >
          <component :is="Component" />
        </transition>
      </router-view>
      <component :is="modalSheetComponent" />
    </q-page-container>
  </q-layout>
</template>

<style lang="sass">
.q-btn-dropdown.hide-arrow
  .q-btn-dropdown__arrow
    display: none
.title-text
  line-height: 1.4rem
  &.text-caption
    font-size: 0.8rem

.fade-enter-active,
.fade-leave-active
  transition: all 0.3s ease
.fade-enter-from,
.fade-leave-to
  opacity: 0
</style>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import LanguageMenu from "components/LanguageMenu.vue";
import Banner from "components/BannerView.vue";

const route = useRoute();
const { t, te } = useI18n();

const isTransitioning = ref(false);

const title = computed(() => {
  const name = route.name?.toString() || "";

  if (name == "start") {
    return "RoaringRoster";
  } else if (name.length > 0 && name != "login" && te(name)) {
    return t(name);
  } else {
    return "";
  }
});
const hasBackButton = computed(() => !["login", "start", ""].includes(route?.name?.toString() || ""))

const modalSheetComponent = computed(() => {
  const sheet = route.params.sheet as string;
  return (route.meta.sheets as Record<string, any>)?.[sheet];
});
</script>
