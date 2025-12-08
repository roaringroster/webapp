<template>
  <div class="member-list">
    <div class="section-heading row justify-between">
      <div class="row items-baseline">
        <div>{{ !memberId ? $t("members") : $t("myDevices") }}</div>
        <div class="q-ml-md text-caption">{{ titleCaption() }}</div>
      </div>
      <div class="q-ml-sm q-pr-xs">
        <q-btn
          v-if="!isDisabled && members.length && (!!memberId || accountStore.isOrganizationAdmin)"
          icon="fa fa-add"
          :title="!memberId ? $t('inviteMembers') : $t('addItem', [$t('device')])"
          round
          outline
          no-caps
          size="10.7px"
          color="primary"
          class="q-mb-xs shadow-1"
          @click="!memberId ? inviteMemberSheet() : inviteDevice()"
        />
      </div>
    </div>
    <div></div>

    <q-list :class="[$q.screen.gt.xs ? 'q-pl-md' : '']">
      <q-expansion-item
        v-for="(member, index) in members"
        :key="member.userId"
        ref="memberItems"
        switch-toggle-side
        dense
        :header-class="['q-pl-none q-pr-xs', memberId ? 'hidden' : '']"
        expand-icon-class="text-primary q-pr-none no-min-width"
        :content-inset-level="$q.screen.gt.xs && !memberId ? 1 : 0"
        :default-opened="!!memberId"
      >

        <template v-slot:header>
          <q-item-section 
            avatar 
            class="q-pr-none q-mr-sm"
            style="width: 56px; height: 56px"
          >
            <signature
              :signature="signatures?.[member.userId]"
              :userName="!signatures ? getMemberName(member) : undefined"
              fallback="?"
              class="self-center bg-grey-7"
              color="white"
              style="font-size: 1.1em"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ getMemberName(member) }}
              <span 
                v-if="isCurrentUser(member)"
                class="text-italic"
              >
                ({{ $t("myAccount") }})
              </span>
            </q-item-label>
            <q-item-label
              caption
              class="row"
            >
              <text-with-tooltip 
                v-if="hasAdminRole(member)"
                :text="$t('hasAdminRole')"
                :tooltip="$t('organizationRolesDescription')"
                width="400px"
              />
              <div
                v-if="hasAdminRole(member)"
                class="q-px-xs"
              >–</div>
              <div>{{ captionForMember(member) }}</div>
            </q-item-label>
          </q-item-section>
          <q-item-section 
            v-if="!memberId" 
            side
          >
            <action-menu 
              v-if="!isDisabled"
              :items="memberActionItems(member, index)" 
              @click.stop
            >
              <template v-slot:admin-toggle>
                <q-item 
                  tag="label"
                  class="q-pl-sm q-py-xs"
                  @click.stop
                >
                  <q-item-section side class="q-pr-sm">
                    <q-checkbox 
                      :model-value="hasAdminRole(member)" 
                      @update:model-value="toggleAdminRole(member)"
                      :disable="!accountStore.isOrganizationAdmin"
                      color="primary"
                      keep-color
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ hasAdminRole(member) ? $t('hasAdminRole') : $t('hasNoAdminRole') }}
                    </q-item-label>
                    <q-item-label caption class="text-primary text-italic" lines="1">
                      <text-with-tooltip 
                        :text="hasAdminRole(member) ? t('dropAdminRoleCaption') : t('assignAdminRoleCaption')"
                        :tooltip="$t('organizationRolesDescription')"
                        width="400px"
                      />
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
              <template v-slot:admin-hint>
                <q-item style="max-width: 360px">
                  <q-item-section 
                    side 
                    class="q-pt-xs"
                    style="justify-content: start"
                  >
                    <q-icon
                      name="fas fa-info-circle"
                      color="grey-6"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption class="line-height-11">
                      {{ $t("oneAdminRequiredMessage", {name: getMemberName(member)}) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </action-menu>
          </q-item-section>
        </template>

        <q-item 
          v-for="device in member.devices"
          :key="device.deviceId"
          dense
          class="q-pl-lg q-pr-xs"
        >
          <q-item-section 
            avatar 
            class="q-pr-sm"
          >
            <q-icon
              :name="deviceIcon(device)" 
              size="md"
              class="self-center"
              color="grey-7"
              style="width: 56px; height: 56px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-input
                v-if="editNameForDeviceId == device.deviceId"
                ref="deviceNameInputs"
                :model-value="device.deviceName"
                @change="onChangeDeviceName"
                @blur="editNameForDeviceId = null"
                dense
              />
              <span v-else>
                {{ device.deviceName }}
                <span 
                  v-if="accountStore.account?.device.deviceId == device.deviceId"
                  class="text-italic"
                >
                  – {{ $t("thisDevice") }}
                </span>
              </span>
            </q-item-label>
            <q-item-label 
              v-if="device.deviceInfo?.deviceType && device.deviceInfo?.deviceType != device.deviceName" 
              caption
              class="text-capitalize"
            >
              {{ $t(device.deviceInfo?.deviceType + "Device") }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <action-menu
              v-if="!isDisabled"
              :items="deviceActionItems(device)" 
              @click.stop
            />
          </q-item-section>
        </q-item>

        <invitation-item 
          v-for="invitation in invitationsForUserId(member.userId)"
          :key="invitation.id"
          :invitation="invitation"
          :seed="invitationSeeds[invitation.id]?.seed"
          :is-revocable="accountStore.isOrganizationAdmin"
          class="q-pl-lg"
          @revoke="revokeInvitation(invitation.id)"
        />
      </q-expansion-item>

      <invitation-item 
        v-for="invitation in invitationsForUserId()"
        :key="invitation.id"
        :invitation="invitation"
        :seed="invitationSeeds[invitation.id]?.seed"
        :is-revocable="accountStore.isOrganizationAdmin"
        class="q-ml-lg"
        @revoke="revokeInvitation(invitation.id)"
      />
    </q-list>
  </div>
</template>

<style lang="sass">
.no-min-width
  min-width: 0
</style>

<script setup lang="ts">
import { computed, onUnmounted, PropType, ref, Ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { QExpansionItem, QInput, useQuasar } from "quasar";
import { DocumentId } from "@automerge/automerge-repo";
import { Member as AuthMember, Device, InvitationState, UnixTimestamp, Base58, ADMIN } from "@localfirst/auth";
import { base58 } from "@localfirst/crypto";
import { useAccountStore } from "src/stores/accountStore";
import { InvitationSeeds, useAccount } from "src/api/local2";
import { cleanupAll, getDocumentsWhenReady, getHandles, getOrganization, removeDocument } from "src/api/repo";
import { didExpire } from "src/helper/expiration";
import { InvitationCodeLength } from "src/helper/utils";
import { deleteItems, HasDocumentId } from "src/models/base";
import { Contact, ContactProps, getUsername } from "src/models/contact";
import Signature from "src/components/Signature.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import ActionMenu from "src/components/ActionMenu.vue";
import InvitationSheet from "src/components/InvitationSheet.vue";
import InvitationItem from "src/components/InvitationItem.vue";

const $q = useQuasar();
const { t } = useI18n();

const isDisabled = computed(() => didExpire());

const {
  getInvitations, 
  addInvitation, 
  deleteInvitation
} = useAccount();
const accountStore = useAccountStore();

const props = defineProps({
  memberId: String,
  signatures: {
    type: Object as PropType<Record<string, string>>
  }
})

const memberItems: Ref<QExpansionItem[]> = ref([]);
const authTeam = getOrganization();
const members: Ref<AuthMember[]> = ref([]);
const adminCount = computed(() => 
  members.value.filter(({userId}) => authTeam?.memberIsAdmin(userId)).length
);
const invitations: Ref<InvitationState[]> = ref([]);

authTeam?.on("updated", onTeamUpdated);
onUnmounted(() => authTeam?.off("updated", onTeamUpdated));
watch(
  () => props.memberId,
  (newValue) => {
    onTeamUpdated();

    if (newValue) {
      memberItems.value.at(0)?.show();
    } else {
      memberItems.value.at(0)?.hide();
    }
  },
  { immediate: true }
);

function onTeamUpdated() {
  members.value = (authTeam?.members() || [])
    .filter(member => !props.memberId || member.userId == props.memberId);
  invitations.value = Object.values(authTeam?.state.invitations || {})
    .filter(invitation => 
      !invitation.revoked 
        && (!invitation.expiration || Date.now() <= invitation.expiration)
        && invitation.uses < invitation.maxUses
        && (!props.memberId || invitation.userId == props.memberId)
    );
  
  // ToDo: cleanup invitationSeeds where invitation.uses == invitation.maxUses
}

const organizationMembers = computed(() => accountStore.organization?.members || {});
const contactHandles = getHandles<Contact>(
  () => Object.values(organizationMembers.value).map(({ contactId }) => contactId)
);
onUnmounted(() => cleanupAll(contactHandles.value));
const contacts = getDocumentsWhenReady(contactHandles);
const contactById = computed(() => contacts.value.reduce(
  (result, contact) => {
    result[contact.id] = contact;
    return result;
  },
  {} as Record<DocumentId, (ContactProps & HasDocumentId)>
));
const contactByUserId = computed(() => Object.entries(organizationMembers.value).reduce(
  (result, [id, { contactId }]) => {
    result[id] = contactById.value[contactId] || null
    return result;
  },
  {} as Record<string, (ContactProps & HasDocumentId) | null>
));

function getMemberName(authMember: AuthMember) {
  return getUsername(contactByUserId.value[authMember.userId]) || authMember.userName;
}


const invitationSeeds: Ref<InvitationSeeds> = ref({});
void getInvitations().then(value => invitationSeeds.value = value);

function invitationsForUserId(userId?: string) {
  return invitations.value.filter(item => item.userId == userId)
}

function inviteMemberSheet() {
  $q.dialog({
    component: InvitationSheet
  })
  .onOk(async ({expiration, maxUses}: {expiration: UnixTimestamp, maxUses: number}) => {
    if (authTeam && accountStore.isOrganizationAdmin) {
      const { seed, id } = authTeam.inviteMember({expiration, maxUses});
      const extendedSeed = seed + seedExtension(true);
      invitationSeeds.value = await addInvitation(id, { expiration, seed: extendedSeed });
    }
  });
}

function seedExtension(forMember: boolean) {
  return base58.encode(
    new Uint8Array([
      Math.floor(Math.random() * InvitationCodeLength) + (Number(forMember) * InvitationCodeLength)
    ])
  );
}

function getCaption(memberCount = 0, invitationCount = 0) {
  let caption = t("deviceCount", memberCount);

  if (invitationCount) {
    caption += ", " + t("invitationCount", invitationCount)
  }

  return caption;
}

function titleCaption() {
  return getCaption(
      members.value
        .map(({devices}) => devices?.length || 0)
        .reduce((a, b) => a + b, 0), 
      invitations.value.length
    );
}

// - member actions

function hasAdminRole(member: {userId: string}) {
  return authTeam?.memberIsAdmin(member.userId) || false;
}

function isCurrentUser(member: {userId: string}) {
  return accountStore.userId == member.userId;
}

function isOnlyAdmin(member: {userId: string}) {
  return hasAdminRole(member) && adminCount.value == 1;
}

function captionForMember(member: AuthMember) {
  return getCaption(member.devices?.length, invitationsForUserId(member.userId).length);
}

function memberActionItems(member: AuthMember, index: number) {
  return [
    {
      customType: "admin-toggle",
      condition: accountStore.isOrganizationAdmin && !isOnlyAdmin(member)
    },
    {
      name: t("addDevice"),
      icon: "fas fa-plus",
      action: async () => {
        await inviteDevice();
        memberItems.value.at(index)?.show();
      },
      condition: isCurrentUser(member),
    },
    {
      name: isCurrentUser(member) ? t("leaveOrganization") : t("removeFromOrganization"),
      icon: "fas fa-user-minus",
      isDestructive: true,
      action: () => removeMember(member),
      condition: accountStore.isOrganizationAdmin && !isOnlyAdmin(member),
    },
    {
      customType: "admin-hint",
      condition: accountStore.isOrganizationAdmin && isOnlyAdmin(member)
    },
  ];
}

async function inviteDevice() {
  if (!authTeam) {
    return;
  }
  
  const expiration = Date.now() + 30 * 60_000 as UnixTimestamp;
  const { seed, id } = authTeam.inviteDevice({ expiration });
  const extendedSeed = seed + seedExtension(false);
  invitationSeeds.value = await addInvitation(id, { expiration, seed: extendedSeed });
}

function toggleAdminRole(member: AuthMember) {
  if (!authTeam || isOnlyAdmin(member)) {
    return;
  }

  if (hasAdminRole(member)) {
    authTeam.removeMemberRole(member.userId, ADMIN)
  } else {
    authTeam.addMemberRole(member.userId, ADMIN)
  }
}

function removeMember(authMember: AuthMember) {
  if (!authTeam || isOnlyAdmin(authMember)) {
    return;
  }
  
  const id = authMember.userId;
  authTeam.remove(id);
  const member = accountStore.organization?.members[id];

  if (member) {
    accountStore.organizationHandle?.changeDoc(doc => {
      doc.formerUserNames[id] = getMemberName(authMember);
      delete doc.members[id];
    });
    removeDocument(member.contactId, authTeam);
    removeDocument(member.workAgreementsId, authTeam);
    removeDocument(member.absencesId, authTeam);
    removeDocument(member.availabilityId, authTeam);

    // remove userId from member and admin lists of all teams
    accountStore.allTeamHandles.forEach(({ doc, changeDoc }) => {
      if (doc && (doc.members.includes(id) || doc.admins.includes(id))) {
        changeDoc(team => {
          deleteItems(team.members, item => item == id);
          deleteItems(team.admins, item => item == id);
        })
      }
    });
  }
}

// - device actions

function deviceActionItems(device: Device) {
  return [
    {
      name: t("editItem", [t("name")]),
      icon: "fas fa-pen-to-square",
      action: () => {
        editNameForDeviceId.value = device.deviceId;
        setTimeout(() => deviceNameInputs.value?.at(0)?.focus?.())
      },
      condition: false, //isCurrentUser({userId: device.userId}),
    },{
      name: t("remove"),
      icon: "fas fa-trash",
      isDestructive: true,
      action: () => removeDevice(device.deviceId),
      condition: accountStore.isOrganizationAdmin || isCurrentUser({userId: device.userId}),
    },
  ];
}

const deviceNameInputs: Ref<QInput[]> = ref([]);
const editNameForDeviceId: Ref<string | null> = ref(null);

function onChangeDeviceName() {
  
}

function removeDevice(id: string) {
  authTeam?.removeDevice(id);
}

function deviceIcon(device: Device) {
  if (device.deviceInfo.deviceType == "mobile") {
    return "fas fa-mobile-screen-button";
  } else if (device.deviceInfo.deviceType == "tablet") {
    return "fas fa-tablet-screen-button";
  } else {
    return "fas fa-desktop";
  }
}

// - invitation actions

async function revokeInvitation(id: Base58) {
  invitationSeeds.value = await deleteInvitation(id);
}

// - hide expired invitations

const timer = setInterval(() => {
  const now = Date.now();

  if (invitations.value.find(invitation => invitation.expiration < now)) {
    onTeamUpdated();
  }
}, 1000);

onUnmounted(() => clearInterval(timer));

</script>
