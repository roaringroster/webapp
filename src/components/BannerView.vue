<template>
  <div>
    <transition
      enter-active-class="animated fadeInDown"
      leave-active-class="animated fadeOutUp"
    >
      <q-banner
        v-if="isLoggedIn && (isOffline || !isConnected)"
        inline-actions
        dense
        class="bg-grey-6 text-white text-center non-selectable offline-banner"
        style="height: 32px"
      >
        <div class="text-caption text-weight-medium ellipsis row justify-center items-center">
          <div>{{ isOffline ? $t("offlineBanner") : $t("noServerConnection") }}</div>
          <!-- <q-btn
            v-if="!isConnected"
            icon="fas fa-rotate-right"
            flat
            dense
            no-caps
            round
            size="sm"
            class="q-ml-xs"
            @click="() => reconnect()"
          /> -->
        </div>
      </q-banner>
    </transition>

    <transition
      enter-active-class="animated fadeInDown"
      leave-active-class="animated fadeOutUp"
    >
      <q-banner
        v-if="banner && showBanner"
        dense
        class="bg-positive text-white default-banner"
      >
        <div class="text-body2 text-center text-weight-medium text-shadow">
          {{ banner.message }}
        </div>
        <template v-slot:action>
            <q-btn
              v-for="(action, index) in banner.actions"
              :key="'action' + index"
              flat
              dense
              no-caps
              rounded
              :label="action.label"
              class="q-px-sm text-weight-bold text-shadow"
              @click="action.action"
            />
        </template>
      </q-banner>
    </transition>

    <transition
      enter-active-class="animated fadeInDown"
      leave-active-class="animated fadeOutUp"
    >
      <q-banner
        v-if="!!updateBanner && showUpdateBanner"
        dense
        :class="[updateBanner.classes ?? 'banner-positive text-black', 'default-banner']"
      >
        <div class="q-px-sm text-body2 text-center">
          {{ updateBanner.message() }}
        </div>
        <template v-slot:action>
          <div class="q-px-xs q-mt-xs">
            <q-btn
              v-for="(action, index) in updateBanner.actions"
              :key="'action' + index"
              flat
              rounded
              dense
              no-caps
              :label="action.label()"
              class="q-px-md text-weight-bold"
              @click="action.action"
            />
          </div>
        </template>
      </q-banner>
    </transition>

  </div>
</template>

<style lang="sass">
.text-shadow
  text-shadow: #0a0 0px 0px 15px
.offline-banner
  padding: 0 !important
.default-banner
  display: block
  .q-banner__content, .q-banner__actions
    max-width: 1000px
    margin: 0 auto
</style>

<script setup lang="ts">
import { computed, inject, onMounted, Ref, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { EventBus } from "quasar";
import { fileSize } from "src/boot/i18n";
import { downloadAndInstall } from "src/boot/updater";
import { UpdateAvailableInfo, UpdateInfo } from "src/boot/eventBus";
import { useAccount } from "src/api/local2";
import { isConnected, reconnect } from "src/api/repo";

const bus = inject<EventBus>("bus");
const { t } = useI18n();
const { isLoggedIn } = useAccount();

type Banner = {
  message: () => string;
  classes?: string;
  actions: {
    label: () => string;
    action: () => void;
  }[]
}

const isOffline = ref(!window.navigator.onLine);
const showBanner = ref(true);
const showUpdateBanner = ref(true);
const updateBanner: Ref<Banner | undefined> = ref(undefined);

const banner = computed(() => undefined as Banner | undefined);

watch(
  () => banner,
  (newValue, oldValue) => {
    if (!!newValue && !!oldValue && JSON.stringify(newValue) != JSON.stringify(oldValue)) {
      showBanner.value = false;
      setTimeout(() => showBanner.value = true, 300);
    }
  }
);

watch(
  () => updateBanner,
  (newValue, oldValue) => {
    if (!!newValue && !!oldValue && JSON.stringify(newValue) != JSON.stringify(oldValue)) {
      showUpdateBanner.value = false;
      setTimeout(() => showUpdateBanner.value = true, 300);
    }
  }
);

function updateOfflineStatus() {
  isOffline.value = !window.navigator.onLine;
}

function updateAvailable(info: UpdateAvailableInfo) {
  updateBanner.value = {
    message: () => t("updateAvailable", {
      ...info,
      downloadSize: info.downloadSize
        ? t("fileSizeUpdate", {fileSize: fileSize(info.downloadSize) })
        : undefined
    }),
    classes: "banner-warning text-black",
    actions: [{
      label: () => t("remindLaterButton"),
      action: () => updateBanner.value = undefined
    }, {
      label: () => t("Yes"),
      action: () => {
        if (info.storeUrl) {
          const open = window.cordova?.InAppBrowser?.open ?? window.open;
          open(info.storeUrl, "_system");
        } else if (info.downloadUrls && info.downloadUrls.length > 0) {
          void downloadAndInstall(info.downloadUrls);

          /* Maybe add direct links to app stores:
            https://f-droid.org/de/packages/${process.env.APP_ID}/
            https://play.google.com/store/apps/details?id=${process.env.APP_ID}
            But it makes even more sense to check if the new version has passed review and is available in store:
            https://f-droid.org/api/v1/packages/${process.env.APP_ID}
            (google play store has no API)
          */
        }

        updateBanner.value = undefined;
      }
    }],
  }
}

function updateUnavailable(info: UpdateInfo) {
  updateBanner.value = {
    message: () => t("updateUnavailable", {version: info.installedVersion}),
    actions: [{
      label: () => t("OK"),
      action: () => updateBanner.value = undefined
    }],
  }
}

onMounted(() => {
  window.addEventListener("online", updateOfflineStatus);
  window.addEventListener("offline", updateOfflineStatus);

  bus?.on("update-available", updateAvailable);
  bus?.on("update-unavailable", updateUnavailable);
})

</script>