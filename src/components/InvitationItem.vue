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
          transition-show="scale"
          transition-hide="scale"
          class="q-pa-none"
        >
          <q-img
            :src="qrDataURL"
            width="240px"
            ratio="1"
            style="cursor: zoom-out"
          />
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
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import ActionMenu from "src/components/ActionMenu.vue";

const { t } = useI18n();
const $q = useQuasar();
const customScheme = process.env.URL_SCHEME;

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
  customScheme
    ? customScheme + "://auth/invitation/" + invitationCode.value
    : invitationCode.value
);
const qrDataURL = useQRCode(invitationUrl);

const invitationCodeTitle = computed(() => {
  const code = invitationCode.value;
  const isMemberInvitation = !props.invitation.userId;
  const target = isMemberInvitation
    ? t("newMembers", props.invitation.maxUses)
    : t("newDevice")

  if (!!invitationCode.value) {
    return t("invitationTitleWithCode", {target, code});
  } else {
    return t("invitationTitleWithoutCode", {target});
  }
})
const invitationCodeHint = computed(() => {
  if (!invitationCode.value) {
    return t("missingInvitationCodeHint");
  } else {
    return "";
  }
})

const isShareSupported = computed(() => !!navigator.share || !!$q.platform.is.cordova);

async function shareInvitation() {
  const appname = process.env.APP_NAME || "";
  const code = invitationCode.value;
  const subject = appname + " " + t("invitation");
  const message = t("invitationMessage", {code});

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
  condition: !isDisabled.value && isShareSupported.value && !!invitationCode.value 
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


const timeToExpiration = ref(timeago(props.invitation.expiration, locale.value) || "");
const timer = setInterval(() => 
  timeToExpiration.value = timeago(props.invitation.expiration, locale.value) || ""
, 1000);

onUnmounted(() => clearInterval(timer));

</script>
