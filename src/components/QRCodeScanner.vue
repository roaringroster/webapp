<template>
  <editing-sheet
    ref="dialogRef"
    :is-data-available="true"
    :title="$t('scanQRCode')"
    has-close-button
    header-class=""
    content-class="q-py-none q-px-none"
    xs-content-class=""
    @hide="emit('hide')"
  >
    <qrcode-stream
      :constraints="{ facingMode }"
      :torch="isTorchOn"
      :track="trackCodes"
      :paused="paused"
      class="bg-black text-white"
      @camera-on="onReady"
      @camera-off="onOff"
      @error="onError"
    >
      <div class="absolute">
        <q-btn
          v-for="(item, index) in drawableCodes"
          :key="index + item.rawValue"
          :label="$t('select')"
          no-caps
          rounded
          outline
          text-color="primary"
          class="absolute qrcode-button"
          :style="`top: ${item.top}px; left: ${item.left}px; width: ${item.width}px; height: ${item.height}px;`"
          @click="onSelectCode(item.rawValue)"
        />
      </div>
      <div 
        class="absolute-center full-width q-px-xl column items-center"
        style="max-width: 600px"
      >
        <q-spinner
          v-if="isLoading"
          size="50px"
        />
        <div class="text-center q-mt-md text-subtitle1">
          {{ loadingMessage || errorMessage }}
        </div>
        <q-btn
          v-if="!isLoading && !!errorMessage && fixPermissionButtonState == 'settings'"
          :label="$t('openAppSettings')"
          no-caps
          rounded
          flat
          dense
          text-color="primary"
          class="q-px-sm"
          @click.stop="switchToSettings"
        />
        <q-btn
          v-else-if="!isLoading && !!errorMessage && fixPermissionButtonState == 'request'"
          :label="$t('grantPermission')"
          no-caps
          rounded
          flat
          dense
          text-color="primary"
          class="q-px-sm"
          @click.stop="requestCameraPermission"
        />
      </div>
      <div class="absolute-bottom q-mb-md q-ml-md column q-gutter-y-md">
        <div>
          <q-btn
            v-if="hasTorch"
            :icon="isTorchOn ? 'flashlight_on' : 'flashlight_off'"
            :title="$t('switchCameraTorch')"
            round
            color="white"
            text-color="primary"
            @click.stop="toggleTorch"
          />
        </div>
        <div>
          <q-btn
            v-if="hasMultipleDevices"
            icon="fas fa-camera-rotate"
            :title="$t('rotateCamera')"
            round
            color="white"
            text-color="primary"
            @click.stop="switchCamera"
          />
        </div>
      </div>
    </qrcode-stream>
  </editing-sheet>
</template>

<style lang="sass">
.scanner-header
  text-shadow: #000 0px 0px 15px
  padding: 0 60px
.qrcode-button
  border: 2px solid
  transition-property: top, left, width, height
  transition-duration: 0.1s
  .q-btn__content :first-child
    color: #ffffff
    background-color: var(--q-primary)
    border-radius: 1rem
    padding: 2px 12px
.qrcode-button, .qrcode-button .q-btn__content :first-child
    box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 5px -1px, rgba(0, 0, 0, 0.14) 0px 5px 8px, rgba(0, 0, 0, 0.12) 0px 1px 14px
</style>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, Ref, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDialogPluginComponent, Platform } from "quasar";
import { QrcodeStream, setZXingModuleOverrides } from "vue-qrcode-reader";
import { InvitationCodeLength } from "src/helper/utils";
import { validCustomSchemes } from "src/helper/appInfo";
import { getPermissionStatus, requestPermissions, switchToSettings, useDiagnostic, PermissionStatus } from "src/helper/cordova";
import EditingSheet from "src/components/EditingSheet.vue";

setZXingModuleOverrides({
  locateFile: (path: string, prefix: string) => {
    if (path.endsWith(".wasm")) {
      return "zxing_reader.wasm";
    }
    return prefix + path;
  },
});

const { t } = useI18n();

const acceptedSchemes = validCustomSchemes()
  .map(value => value.replace(/\./g, "\\."))
  .join("|");
const regexp = new RegExp("^(" + acceptedSchemes + ")://auth/invitation/([A-Za-z0-9]{" 
  + InvitationCodeLength + "})$");

defineProps({
  maxWidth: {
    type: Number,
    default: 900
  },
});

const emit = defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef } = useDialogPluginComponent();

const isLoading = ref(true);
const loadingMessage = computed(() => 
  isLoading.value 
    ? t("waitingForCamera")
    : ""
);

function onReady(capabilities: MediaTrackCapabilities) {
  isLoading.value = false;
  fixPermissionButtonState.value = "none";
  hasTorch.value = !!(capabilities as any).torch;
}

function onOff() {
  enableLoading();
}

function enableLoading() {
  isLoading.value = true;
  detectedCodes = {};
  drawableCodes.value = [];
}

const hasTorch = ref(false);
const isTorchOn = ref(false);

function toggleTorch() {
  isTorchOn.value = !isTorchOn.value;
  enableLoading();
}

const devices: Ref<MediaDeviceInfo[]> = ref([]);
const hasMultipleDevices = computed(() => devices.value.length > 1);
const facingMode: Ref<ConstrainDOMString> = ref("environment");
const updateMediaDevicesInterval = setInterval(updateMediaDevices, 1000);

onUnmounted(() => clearInterval(updateMediaDevicesInterval));

async function updateMediaDevices() {
  if (navigator?.mediaDevices?.enumerateDevices) {
    devices.value = (await navigator.mediaDevices.enumerateDevices())
      .filter(({ kind }) => kind == "videoinput") || [];
  }
}

function switchCamera() {
  // a more explicit alternative to facingMode would be to use camera deviceId as constraints,
  // but I prefer to switch more generic between front and rear camera
  if (facingMode.value == "user") {
    facingMode.value = "environment";
  } else {
    facingMode.value = "user";
  }

  enableLoading();
}

type QRCode = {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: {x: number; y: number}[];
}
type DrawableCode = {
  time: number;
  rawValue: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

let detectedCodes: Record<string, DrawableCode> = {};

function trackCodes(codes: QRCode[]) {
  const time = Date.now();
  codes
    .filter(code => regexp.test(code.rawValue))
    .forEach(({ boundingBox: { top, left, width, height }, rawValue }) => 
      detectedCodes[rawValue] = { top, left, width, height, rawValue, time }
    )
}

const drawableCodes: Ref<DrawableCode[]> = ref([]);

/* Because trackCodes() drops detected codes quite often just to re-detect them 
 a few milliseconds later, while we prefer to highlight the detected codes 
 relaiably without flickers, we remember all detected code values with a timestamp
 when we saw them last, and show all of them that were detected during a certain
 amount of passed time to achieve a smooth user experience. */
const updateDrawableCodesInterval = setInterval(() => {
  const now = Date.now();
  drawableCodes.value = Object.values(detectedCodes)
    .filter(({ time }) => time + 500 > now)
}, 16);

onUnmounted(() => clearInterval(updateDrawableCodesInterval));

function onSelectCode(value: string) {
    const invitationCode = regexp.exec(value)?.at(2);
    emit("ok", invitationCode);
    dialogRef.value?.hide();
}

const errorMessage = ref("");
const CameraPermission = useDiagnostic()?.permission?.CAMERA || "";

async function onError(error: Error) {
  isLoading.value = false;
  let errorName = error.name;
  console.error(error);

  // on Cordova Android, we get a NotReadableError with permission problems, so we 
  // check the permission status to ensure to work with the more precise NotAllowedError.
  const status = await getPermissionStatus(CameraPermission);

  if (!!status && status != "GRANTED") {
    errorName = "NotAllowedError";
  }

  if (errorName === "NotAllowedError") {
    errorMessage.value = t("CameraAccessNotAllowedError");
    showFixPermissionButton(status);
  } else if (errorName === "NotFoundError") {
    errorMessage.value = t("NoCameraError");
  } else if (errorName === "NotReadableError") {
    errorMessage.value = t("CameraNotReadableError");
    showFixPermissionButton(status);
  } else if ([
    "InsecureContextError", 
    "NotSupportedError", 
    "StreamApiNotSupportedError", 
    "OverconstrainedError"
  ].includes(errorName)) {
    errorMessage.value = t("CameraNotSupportedError");
  } else {
    errorMessage.value = t("GenericError");
  }
}

// when camera permission is denied on Cordova Android, an error is not reliably
// triggered, so we need to be sure if we have a problem and need to display an error
if (Platform.is.android) {
  onMounted(async () => {
    const status = await getPermissionStatus(CameraPermission);

    if (status != "GRANTED") {
      await onError(new DOMException("", "NotAllowedError"));
    }
  })
}

const fixPermissionButtonState: Ref<"none" | "settings" | "request"> = ref("none");

function showFixPermissionButton(status: PermissionStatus | undefined) {
  if (Platform.is.cordova) {
    if (Platform.is.ios || status == "DENIED_ALWAYS") {
      fixPermissionButtonState.value = "settings";
    } else if (Platform.is.android) {
      fixPermissionButtonState.value = "request";
    }
  }
}

async function requestCameraPermission() {
  const status = (await requestPermissions([CameraPermission]))?.[CameraPermission];

  if (status != "GRANTED") {
    showFixPermissionButton(status);
  }
}

const paused = ref(false);

</script>