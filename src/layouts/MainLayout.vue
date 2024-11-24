<template>
  <q-layout view="hHh Lpr lff" class="bg-white">
    <q-header class="bg-white print-hide">
      <q-toolbar
        :class="'shadow-3 bg-primary-gradient ' + ($q.screen.lt.sm ? 'q-px-none' : '')"
        style="z-index: 1000"
      >
        <q-btn
          v-if="hasMenuButton"
          flat
          icon="menu"
          aria-label="menu"
          @click="$bus.emit('toggle-drawer')"
        />
        <div 
          v-else
          style="width: 60px"
        ></div>

        <q-toolbar-title class="text-center">
          <div class="ellipsis title-text">{{ title }}</div>
        </q-toolbar-title>

        <document-menu />
      </q-toolbar>
      <banner />
      <div
        class="absolute-full overflow-hidden no-pointer-events"
        style="bottom: -10px"
      ></div>
    </q-header>

    <navigation-drawer v-if="hasDrawer" />
    
    <q-page-container>
      <div class="print-only text-black text-center text-subtitle2 border-bottom-grey">
        {{ title }}
      </div>
      <router-view v-slot="{ Component, route }">
        <transition
          :name="(route.meta.transition as string | undefined)"
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
import { useQuasar, QLayout, useMeta } from "quasar";
import { locale } from "src/boot/i18n";
import DocumentMenu from "src/components/DocumentMenu.vue";
import Banner from "src/components/BannerView.vue";
import NavigationDrawer from "src/components/NavigationDrawer.vue";
// import { useAPI } from "src/api";
import { useAccount } from "src/api/local2";

const route = useRoute();
const { t, te } = useI18n();
const { screen } = useQuasar();
// const api = useAPI();
const { isLoggedIn } = useAccount();

// const isDemo = false;
useMeta({
  // title: "RoaringRoster" + (isDemo ? " – " + t("demoAppTitle") : " App" ),
  meta: {
    // description: { name: "description", content: t("appDescription") },
    google: { name: "google", content: "notranslate" },
    contentLanguage: {
      "http-equiv": "Content-Language",
      content: locale.value
    }
  }
});

const isTransitioning = ref(false);

const title = computed(() => {
  const name = route.name?.toString() || "";

  if (name.length > 0 && name != "login" && te(name)) {
    return t(name);
  } else {
    return "";
  }
});

const hasDrawer = computed(() => isLoggedIn.value || isTransitioning.value);
const hasMenuButton = computed(() => hasDrawer.value && screen.lt.md);

const modalSheetComponent = computed(() => {
  const sheet = route.params.sheet as string;
  return (route.meta.sheets as Record<string, any>)?.[sheet];
});

</script>
