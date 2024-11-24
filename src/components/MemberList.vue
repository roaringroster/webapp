<template>
  <div class="member-list">
    <div class="section-heading row justify-between">
      <div class="row items-baseline">
        <div>{{ !memberId ? $t("members") : $t("myDevices") }}</div>
        <div class="q-ml-md text-caption">{{ titleCaption() }}</div>
      </div>
      <div class="q-ml-sm q-pr-xs">
        <q-btn
          v-if="!isDisabled && members.length && (!!memberId || isAdmin)"
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
              :userName="member.userName"
              class="self-center bg-grey-7"
              color="white"
              style="font-size: 1.1em"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ member.userName }}
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
                        :disable="!isAdmin"
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
                    <q-item-label caption class="line-height-11">{{ $t("oneAdminRequiredMessage", {name: member.userName}) }}
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
                v-if="editNameForDevicId == device.deviceId"
                ref="deviceNameInputs"
                :model-value="device.deviceName"
                @change="onChangeDeviceName"
                @blur="editNameForDevicId = null"
                dense
              />
              <span v-else>
                {{ device.deviceName }}
                <span 
                  v-if="account?.device.deviceId == device.deviceId"
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
          :is-revocable="isAdmin"
          class="q-pl-lg"
          @revoke="revokeInvitation(invitation.id)"
        />
      </q-expansion-item>

      <invitation-item 
        v-for="invitation in invitationsForUserId()"
        :key="invitation.id"
        :invitation="invitation"
        :seed="invitationSeeds[invitation.id]?.seed"
        :is-revocable="isAdmin"
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
import { computed, onUnmounted, ref, Ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { QExpansionItem, QInput, useQuasar } from "quasar";
import { Member, Device, InvitationState, UnixTimestamp, Base58, ADMIN } from "@localfirst/auth";
import { base58 } from "@localfirst/crypto";
import { InvitationSeeds, useAccount } from "src/api/local2";
import { cleanupAll, getOrganization, removeDocument, useDocument2, useDocuments, useOrganizationDocument, whenReady } from "src/api/repo";
import { didExpire } from "src/helper/expiration";
import { InvitationCodeLength } from "src/helper/utils";
import { Organization } from "src/models/organization";
import { Contact, getName } from "src/models/contact";
import { Team } from "src/models/team";
import Signature from "src/components/Signature.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import ActionMenu from "src/components/ActionMenu.vue";
import InvitationSheet from "src/components/InvitationSheet.vue";
import InvitationItem from "src/components/InvitationItem.vue";

const $q = useQuasar();
const { t } = useI18n();

const isDisabled = computed(() => didExpire());

const { 
  getAccountRef, 
  getInvitations, 
  addInvitation, 
  deleteInvitation
} = useAccount();
const account = getAccountRef();

const props = defineProps({
  memberId: String
})

const team = getOrganization();
const isAdmin: Ref<boolean> = ref(false);
const members: Ref<Member[]> = ref([]);
const adminCount = computed(() => 
  members.value.filter(({userId}) => team?.memberIsAdmin(userId)).length
);
const invitations: Ref<InvitationState[]> = ref([]);

team?.on("updated", onTeamUpdated);
onUnmounted(() => team?.off("updated", onTeamUpdated));
watch(
  () => props.memberId,
  (newValue) => {
    onTeamUpdated();

    if (newValue) {
      memberItems.value.at(0)?.show();
    } else {
      memberItems.value.at(0)?.hide();
    }
  }
);

function onTeamUpdated() {
  const userId = account.value?.user.userId;
  isAdmin.value = !!userId && !!team && team.has(userId) && team.memberIsAdmin(userId);
  members.value = (team?.members() || [])
    .filter(member => !props.memberId || member.userId == props.memberId);
  invitations.value = Object.values(team?.state.invitations || {})
    .filter(invitation => 
      !invitation.revoked 
        && Date.now() <= invitation.expiration
        && invitation.uses < invitation.maxUses
        && (!props.memberId || invitation.userId == props.memberId)
    );
  
  // ToDo: cleanup invitationSeeds where invitation.uses == invitation.maxUses
}

onTeamUpdated();


const invitationSeeds: Ref<InvitationSeeds> = ref({});
getInvitations().then(value => invitationSeeds.value = value);

function invitationsForUserId(userId?: string) {
  return invitations.value.filter(item => item.userId == userId)
}

function inviteMemberSheet() {
  $q.dialog({
    component: InvitationSheet
  })
  .onOk(async ({expiration, maxUses}: {expiration: UnixTimestamp, maxUses: number}) => {
    if (team && isAdmin.value) {
      let { seed, id } = team.inviteMember({expiration, maxUses});
      seed = seed + seedExtension(true);
      invitationSeeds.value = await addInvitation(id, {expiration, seed});
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


const memberItems: Ref<QExpansionItem[]> = ref([]);

function hasAdminRole(member: {userId: string}) {
  return team?.memberIsAdmin(member.userId) || false;
}

function isCurrentUser(member: {userId: string}) {
  return account.value?.user.userId == member.userId;
}

function isOnlyAdmin(member: {userId: string}) {
  return hasAdminRole(member) && adminCount.value == 1;
}

function captionForMember(member: Member) {
  return getCaption(member.devices?.length, invitationsForUserId(member.userId).length);
}

function memberActionItems(member: Member, index: number) {
  return [
    {
      customType: "admin-toggle",
      condition: isAdmin.value && !isOnlyAdmin(member)
    },
    {
      name: t("addDevice"),
      icon: "fas fa-plus",
      action: () => {
        inviteDevice();
        memberItems.value.at(index)?.show();
      },
      condition: isCurrentUser(member),
    },
    {
      name: isCurrentUser(member) ? t("leaveOrganization") : t("removeFromOrganization"),
      icon: "fas fa-user-minus",
      isDestructive: true,
      action: () => removeMember(member),
      condition: isAdmin.value && !isOnlyAdmin(member),
    },
    {
      customType: "admin-hint",
      condition: isAdmin.value && isOnlyAdmin(member)
    },
  ];
}

async function inviteDevice() {
  if (!team) {
    return;
  }
  
  const expiration = Date.now() + 30 * 60_000 as UnixTimestamp;
  let { seed, id } = team.inviteDevice({ expiration });
  seed = seed + seedExtension(false);
  invitationSeeds.value = await addInvitation(id, {expiration, seed});
}

function toggleAdminRole(member: Member) {
  if (!team || isOnlyAdmin(member)) {
    return;
  }

  if (hasAdminRole(member)) {
    team.removeMemberRole(member.userId, ADMIN)
  } else {
    team.addMemberRole(member.userId, ADMIN)
  }
}

async function removeMember(member: Member) {
  if (!team || isOnlyAdmin(member)) {
    return;
  }
  
  const id = member.userId;
  team.remove(id);

  const orgHandle = useOrganizationDocument();
  await orgHandle.handle?.whenReady(); // ensure handle.doc will not be null
  const user = orgHandle.doc.value?.members[id];

  if (user) {
    const teamIds = orgHandle.doc.value?.teams.map(({ docId }) => docId) || [];
    const teamHandles = useDocuments<Team>(teamIds);
    const userContactHandle = useDocument2<Contact>(user.contactId);
    const handleList = [...teamHandles, userContactHandle];
    await whenReady(handleList);

    const name = getName(userContactHandle.doc.value);
    orgHandle.changeDoc((doc: Organization) => {
      doc.formerMembers[id] = { name };
      delete doc.members[id];
    });
    removeDocument(team, user.contactId);
    removeDocument(team, user.absencesId);
    removeDocument(team, user.availabilityId);
    removeDocument(team, user.workAgreementsId);

    // remove userId from member and admin lists of all teams
    teamHandles.forEach(({ doc, changeDoc }) => {
      const value = doc.value;

      if (value && (Object.keys(value.members).includes(id) || value.admins.includes(id))) {
        changeDoc(doc => {
          if (Object.keys(doc.members).includes(id)) {
            delete doc.members[id];
          }

          const index = doc.admins.indexOf(id);

          if (index >= 0) {
            doc.admins.splice(index, 1);
          }
        })
      }
    });

    cleanupAll(handleList);
  }

  orgHandle.cleanup();
}

// - device actions

function deviceActionItems(device: Device) {
  return [
    {
      name: t("editItem", [t("name")]),
      icon: "fas fa-pen-to-square",
      action: () => {
        editNameForDevicId.value = device.deviceId;
        setTimeout(() => deviceNameInputs.value?.at(0)?.focus?.())
      },
      condition: false && isCurrentUser({userId: device.userId}),
    },{
      name: t("remove"),
      icon: "fas fa-trash",
      isDestructive: true,
      action: () => removeDevice(device.deviceId),
      condition: isAdmin.value || isCurrentUser({userId: device.userId}),
    },
  ];
}

const deviceNameInputs: Ref<QInput[]> = ref([]);
const editNameForDevicId: Ref<string | null> = ref(null);

function onChangeDeviceName() {
  
}

function removeDevice(id: string) {
  team?.removeDevice(id);
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
