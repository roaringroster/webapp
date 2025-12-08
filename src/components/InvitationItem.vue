<template>
  <q-item 
    dense 
    class="q-pl-none q-pr-xs"
  >
    <q-item-section 
      avatar 
      class="q-pr-sm"
    >
      <q-img
        v-if="!!invitationCode"
        :src="qrDataURL"
        width="56px"
        ratio="1"
        style="cursor: zoom-in"
      >
        <q-popup-edit 
          modelValue="" 
          auto-close
          max-height="95vh"
          transition-show="scale"
          transition-hide="scale"
          class="q-pa-none"
        >
          <div class="row items-center justify-center">
            <div>
              <q-img
                :src="qrDataURL"
                width="240px"
                ratio="1"
                style="cursor: zoom-out"
              />
            </div>
            <div 
              class="q-pa-md"
              style="min-width: 240px; max-width: 420px"
            >
              <div class="text-h6 line-height-15">
                {{ memberOrDeviceText(
                  $t("memberInvitationInstructionTitle"), 
                  $t("deviceInvitationInstructionTitle", { appName })) }}
              </div>
              <ol class="q-mb q-pl-lg">
                <li>
                  <simplified-markdown 
                    :text="memberOrDeviceText(
                      $t('memberInvitationInstructionStep1', { appName }), 
                      $t('deviceInvitationInstructionStep1', { appName }))"
                  />
                </li>
                <li>
                  <simplified-markdown 
                    :text="memberOrDeviceText(
                      $t('memberInvitationInstructionStep2', {joinButtonLabel: t('addNewDevice')}), 
                      $t('deviceInvitationInstructionStep2', {joinButtonLabel: t('addNewDevice')}))" 
                  />
                </li>
                <li>
                  <simplified-markdown 
                    :text="memberOrDeviceText(
                      $t('memberInvitationInstructionStep3'), 
                      $t('deviceInvitationInstructionStep3'))" 
                  />
                </li>
              </ol>
              <q-btn
                v-if="!isDisabled && isShareSupported"
                :label="memberOrDeviceText(
                  $t('memberInvitationShareButton'),
                  $t('deviceInvitationShareButton'))"
                no-caps
                flat
                rounded
                dense
                color="primary"
                @click.stop="shareInvitation()"
              />
            </div>
          </div>
        </q-popup-edit>
      </q-img>
      <q-icon 
        v-else
        name="fas fa-clipboard-question" 
        size="lg"
        class="self-center text-grey-7"
        style="width: 56px; height: 56px"
      />
    </q-item-section>

    <q-item-section>
      <div class="full-width row no-wrap">
        <div class="col column justify-center">
          <q-item-label class="invitation-code">
            <text-with-tooltip
              :text="invitationCodeTitle"
              :tooltip="invitationCodeHint"
              iconClass="text-grey-7"
              class="selectable"
            />
          </q-item-label>
          <q-item-label 
            caption 
            class="text-italic"
          >
            <span v-if="!invitation.userId && invitation.maxUses > 0">
              {{ $t("invitationCodeUsage", invitation) }}; 
            </span>
            <span>
              {{ $t("expiresIn", {timeToExpiration}) }}
            </span>
          </q-item-label>
        </div>
        <div class="row items-center justify-end q-gutter-sm" style="max-width: 30%">
          <q-btn
            v-if="!isDisabled && !!invitationCode"
            :icon="isCopied ? 'fas fa-check' : 'far fa-clipboard'"
            :title="$t('Copy')"
            round
            flat
            no-caps
            color="primary"
            dense
            size="14px"
            @click="copyInvitation()"
          />
          <q-btn
            v-if="!isDisabled && isShareSupported && !!invitationCode && $q.screen.gt.xs"
            icon="share"
            :title="$t('share')"
            round
            flat
            no-caps
            color="primary"
            dense
            size="14px"
            @click="shareInvitation()"
          />
          <action-menu
            :items="actionItems" 
            @click.stop
          />
        </div>
      </div>
    </q-item-section>
  </q-item>
</template>

<style lang="sass">
.invitation-code
  overflow-wrap: break-word
  line-height: 1.1em
</style>

<script setup lang="ts">
import { computed, ref, Ref, PropType, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { InvitationState } from "@localfirst/auth";
import { getShareId } from "@localfirst/auth-provider-automerge-repo";
import { locale } from "src/boot/i18n";
import { getOrganization } from "src/api/repo";
import { didExpire } from "src/helper/expiration";
import { notifySuccess } from "src/helper/notify";
import { copyText } from "src/helper/clipboard";
import { useQRCode } from "src/helper/qrcode";
import { timeago } from "src/helper/relativeTime";
import { appCustomURLScheme, appDownloadURL, appName } from "src/helper/appInfo";
import { isShareSupported } from "src/helper/cordova";
import { useAccountStore } from "src/stores/accountStore";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import ActionMenu from "src/components/ActionMenu.vue";
import SimplifiedMarkdown from "src/components/SimplifiedMarkdown.vue";

const { t } = useI18n();
const $q = useQuasar();
const accountStore = useAccountStore();

const emit = defineEmits(["revoke"]);

const props = defineProps({
  invitation: {
    type: Object as PropType<InvitationState>,
    required: true,
  },
  seed: String,
  isRevocable: Boolean
});

const isDisabled = computed(() => didExpire());

const team = getOrganization();

const invitationCode = computed(() => 
  team && props.seed
    ? getShareId(team) + props.seed
    : ""
);
const invitationUrl = computed(() => 
  appCustomURLScheme
    ? appCustomURLScheme + "://auth/invitation/" + invitationCode.value
    : invitationCode.value
);
const qrDataURL = useQRCode(invitationUrl);

function memberOrDeviceText(memberInvitationText: string, deviceInvitationText: string) {
  return !props.invitation.userId
    ? memberInvitationText
    : deviceInvitationText;
}

const invitationCodeTitle = computed(() => {
  const code = invitationCode.value;
  const target = memberOrDeviceText(
    t("newMembers", props.invitation.maxUses),
    t("newDevice")
  );

  if (invitationCode.value) {
    return t("invitationTitleWithCode", {target, code});
  } else {
    return t("invitationTitleWithoutCode", {target});
  }
})
const invitationCodeHint = computed(() => {
  if (!invitationCode.value) {
    return t("missingInvitationCodeHint");
  } else {
    return memberOrDeviceText(
      t("memberInvitationCodeHint"), 
      t("deviceInvitationCodeHint")
    );
  }
})

async function shareInvitation() {
  const code = invitationCode.value;
  const codeExpiration = timeToExpiration.value;
  const expirationHint = props.invitation.expiration
    ? t("invitationExpirationHint", { codeExpiration })
    : ""
  const invitationURL = invitationUrl.value;
  const organizationName = accountStore.organization?.name || "";
  const subject = appName + " " + t("invitation");
  const appDescription = t("appDescriptionForInvitation");
  const joinButtonLabel = t("addNewDevice");
  const message = t(
    "invitationMessage", 
    {
      appName, appDescription, appDownloadURL, 
      organizationName,
      code, invitationURL, expirationHint,
      joinButtonLabel
    }
  ) + "\n\n";

  // navigator.share does not work in electron.
  // There is a macOS only ShareMenu class for main process though: https://www.electronjs.org/docs/latest/api/share-menu.
  if (navigator.share) {
    await navigator.share({title: subject, text: message}).catch(() => {})
  } else if ($q.platform.is.cordova) {
    window.plugins?.socialsharing?.shareWithOptions({ subject, message });
  }
}

const isCopied = ref(false);
const isCopiedTimeout: Ref<number | null> = ref(null);

async function copyInvitation() {
  if (isCopiedTimeout.value) {
    window.clearTimeout(isCopiedTimeout.value);
  }

  isCopied.value = await copyText(invitationCode.value);

  if (isCopied.value) {
    isCopiedTimeout.value = window.setTimeout(() => {
      isCopied.value = false
      isCopiedTimeout.value = null;
    }, 2000);

    notifySuccess(t("copied"));
  }
}

const actionItems = computed(() => [{
  name: t("share"),
  icon: "share",
  action: () => shareInvitation(),
  condition: !isDisabled.value && isShareSupported && !!invitationCode.value 
    && !$q.screen.gt.xs
}, {
  name: t("revokeInvitation"),
  icon: "fas fa-trash",
  isDestructive: true,
  action: () => revokeInvitation(),
  condition: props.isRevocable
}]);

function revokeInvitation() {
  team?.revokeInvitation(props.invitation.id);
  emit("revoke");
}

function formatExpiration() {
  return props.invitation.expiration
    ? timeago(props.invitation.expiration, locale.value) || ""
    : t("never")
}

const timeToExpiration = ref(formatExpiration());
const timer = setInterval(() => 
  timeToExpiration.value = formatExpiration()
, 1000);

onUnmounted(() => clearInterval(timer));

</script>
