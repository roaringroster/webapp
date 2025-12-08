<template>
  <q-page
    padding
    class="limit-page-width width-xs"
  >
    <div
      v-if="teamOptions.length == 0"
      class="q-mt-lg"
    >
      <div>{{ $t("noExistingTeams") }}</div>
      <q-btn 
        :label="$t('addTeam')"
        rounded
        no-caps
        color="primary"
        class="q-mt-md"
        :disable="disabled"
        @click="createNewTeam"
      />
    </div>
    <div v-else>
      <div class="row items-end q-mb-xl q-ml-md q-pl-lg">
        <q-select
          v-model="teamId"
          :label="$t('selectedTeam')"
          :options="teamOptions"
          emit-value
          map-options
          :behavior="selectBehavior()"
          class="col"
        />
        <div class="q-ml-md q-mr-sm q-mb-xs">
          <q-btn
            icon="fa fa-add"
            :title="$t('addTeam')"
            round
            outline
            no-caps
            size="10.7px"
            color="primary"
            class="shadow-1"
            :disable="disabled"
            @click="createNewTeam"
          />
        </div>
      </div>

      <div 
        v-if="!accountStore.team" 
        class="q-mt-md q-ml-md q-pl-lg"
      >
        {{ $t("teamNotFound") }}
      </div>
      <div v-else>

        <q-expansion-item
          v-if="isTeamAdmin"
          v-model="expandedSettings"
          :label="$t('generalSettings')"
          header-class="section-heading q-px-none dense-avatar"
          switch-toggle-side
          :default-opened="false"
        >
          <div>
            <q-input
              :model-value="teamName"
              :label="$t('teamName')"
              ref="teamNameInput"
              :debounce="debounce"
              @update:model-value="teamName = alwaysString($event)"
            />
            <div class="q-mt-sm row q-gutter-md">
              <q-btn
                :label="$t('deleteTeam') + '…'"
                icon="fas fa-user-slash"
                outline
                rounded
                no-caps
                color="negative"
                @click="deleteTeam"
              />
            </div>
          </div>
        </q-expansion-item>

        <q-expansion-item
          v-model="expandedMembers"
          header-class="section-heading q-px-none dense-avatar"
          switch-toggle-side
          class="q-mt-xl"
        >
          <template v-slot:header>
            <q-item-section>
              <q-item-label>
                {{ $t('teamMembers') }}
                <span 
                  class="text-caption q-ml-sm"
                >
                  ({{ teamMembersCount }})
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                v-if="expandedMembers && isTeamAdmin && !disabled 
                  && nonMemberUserIds.length > 0 && !isDemo"
                icon="fa fa-add"
                :title="$t('addTeamMember')"
                round
                outline
                no-caps
                size="10.7px"
                color="primary"
                class="q-mb-xs q-mr-sm shadow-1"
                @click.stop="addMemberToTeam"
              />
            </q-item-section>
          </template>

          <q-list>
            <q-item 
              v-for="member in allMembers" 
              :key="member.userId" 
              class="q-pl-none q-pr-sm"
            >
              <q-item-section side>
                <signature 
                  :userName="getMemberName(member.userId)"
                  fallback="?"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="isCurrentUser(member.userId) ? 'text-weight-medium' : ''">
                  {{ member.username || $t('unknownMember') }} {{ getCurrentUserText(member.userId) }}
                </q-item-label>
                <q-item-label
                  v-if="hasAdminRole(member.userId)"
                  caption
                >
                  <text-with-tooltip 
                    :text="$t('hasTeamAdminRole')"
                    :tooltip="$t('teamRolesDescription')"
                  />
                </q-item-label>
              </q-item-section>
              <q-item-section 
                v-if="isTeamAdmin || isCurrentUser(member.userId)"
                side
              >
                <action-menu :items="userActionItems(member.userId)">
                  <template v-slot:admin-toggle>
                    <q-item 
                      tag="label"
                      class="q-pl-sm q-py-xs"
                      @click.stop
                    >
                      <q-item-section side class="q-pr-sm">
                        <q-checkbox 
                          :model-value="hasAdminRole(member.userId)" 
                          @update:model-value="toggleAdminRole(member.userId)"
                          :disable="!isTeamAdmin"
                          color="primary"
                          keep-color
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>
                          {{ hasAdminRole(member.userId) ? $t('hasTeamAdminRole') : $t('hasNoTeamAdminRole') }}
                        </q-item-label>
                        <q-item-label caption class="text-primary text-italic" lines="1">
                          <text-with-tooltip 
                            :text="hasAdminRole(member.userId) ? t('dropAdminRoleCaption') : t('assignAdminRoleCaption')"
                            :tooltip="$t('teamRolesDescription')"
                            width="400px"
                          />
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </action-menu>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>

      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, Ref, ref, } from "vue";
import { useI18n } from "vue-i18n";
import { QInput, useQuasar } from "quasar";
import { DocumentId } from "@automerge/automerge-repo";
import { useAccountStore } from "src/stores/accountStore";
import { getDocumentsWhenReady, cleanupAll, createDocument, removeDocument, getHandles } from "src/api/repo";
import { debounce, alwaysString } from "src/helper/input";
import { incrementalName, selectBehavior } from "src/helper/utils";
import { isDemo } from "src/helper/appInfo";
import { didExpire } from "src/helper/expiration";
import { confirmDeletionWarning } from "src/helper/warning";
import { deleteItems, HasDocumentId } from "src/models/base";
import { createTeam } from "src/models/team";
import { Contact, getUsername, ContactProps } from "src/models/contact";
import Signature from "src/components/Signature.vue";
import ActionMenu from "src/components/ActionMenu.vue";
import TextWithTooltip from "src/components/TextWithTooltip.vue";
import SelectDialog from "src/components/SelectDialog.vue";

const { t } = useI18n();
const $q = useQuasar();
const accountStore = useAccountStore();

const teamNameInput: Ref<QInput | null> = ref(null);

const expandedSettings = ref(true);
const expandedMembers = ref(true);

const disabled = computed(() => didExpire());
const isTeamAdmin = computed(() => 
  accountStore.team?.admins.includes(accountStore.userId) || false
);

const teamId = computed({
  get: () => accountStore.account?.activeTeam,
  set: value => accountStore.updateAccount(account => account.activeTeam = value)
});

const teamName = computed({
  get: () => accountStore.team?.name || "",
  set: value => {
    if (value) {
      accountStore.teamHandle?.changeDoc(doc => doc.name = value);
    }
  }
});

const teamOptions = computed(() => accountStore.teams
  .map(team => ({
    label: team.name || t("withoutNames"),
    value: team.id
  }))
  .sort((a, b) => a.label.localeCompare(b.label))
);

const teamMembersCount = computed(() => accountStore.team?.members.length || 0);
const organizationMembers = computed(() => accountStore.organization?.members || {});

const nonMemberUserIds = computed(() => {
  const teamMembers = new Set(accountStore.team?.members);
  return Object.keys(organizationMembers.value)
    .filter(userId => !teamMembers.has(userId));
})

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

function getMemberName(userId: string) {
  return getUsername(contactByUserId.value[userId]) 
    || accountStore.authTeam?.members(userId).userName;
}

const membersInAdditionalTeams = computed(() => 
  new Set(
    accountStore.teams.flatMap(({ id, members }) => 
      id != teamId.value ? members : []
    )
  )
);

const allMembers = computed(() => {
  return accountStore.team?.members.map(userId => ({
    userId,
    username: getMemberName(userId),
  }))
});

const infoDialog = {
  persistent: true,
  ok: {
    rounded: true,
    unelevated: true,
  }
};

async function createNewTeam() {
  if (accountStore.account && accountStore.authTeam) {
    const teamNames = accountStore.teams.map(({ name }) => name);
    const name = incrementalName(t("newTeam"), teamNames);
    const members = [accountStore.userId];
    const admins = [accountStore.userId];
    const team = createTeam({ name, members, admins }, accountStore.authTeam);
    const teamId = createDocument(team, accountStore.authTeam);
    accountStore.organizationHandle?.changeDoc(doc => doc.teams.push(teamId));
    await accountStore.updateAccount(account => account.activeTeam = teamId);

    expandedSettings.value = true;
    expandedMembers.value = true;
    setTimeout(() => teamNameInput.value?.focus(), 100);
  }
}

function isCurrentUser(userId: string) {
  return accountStore.userId == userId;
}

function getCurrentUserText(userId: string) {
  if (isCurrentUser(userId)) {
    return "(" + t("myAccount") + ")";
  } else {
    return "";
  }
}

function hasAdminRole(userId: string) {
  return accountStore.team?.admins.includes(userId) || false
}

function isSingleAdmin(userId: string) {
  return hasAdminRole(userId) && accountStore.team?.admins.length == 1
}

function userActionItems(userId: string) {
  const removeFromTeamCaption = removeFromTeamDisabledReason(userId);

  return [
    {
      customType: "admin-toggle",
      condition: isTeamAdmin.value && teamMembersCount.value >= 2
    },
    {
      name: isCurrentUser(userId) ? t("leaveTeam") : t("removeFromTeam"),
      caption: removeFromTeamCaption,
      icon: "fas fa-user-minus",
      isDestructive: true,
      action: () => removeFromTeam(userId),
      disabled: !!removeFromTeamCaption,
      condition: isTeamAdmin.value,
    },
  ];
}

function removeFromTeamDisabledReason(userId: string) {
  if (teamMembersCount.value < 2) {
    return t("singleTeamMemberRemovalDisabledReason");
  } else if (!membersInAdditionalTeams.value.has(userId)) {
    return t("onlyTeamForMemberRemovalDisabledReason");
  } else if (isSingleAdmin(userId)) {
    return t("singleTeamAdminRemovalDisabledReason");
  } else {
    return undefined;
  }
}


function addMemberToTeam() {
  if (nonMemberUserIds.value.length) {
    const selectOptions = nonMemberUserIds.value.map(value => ({
      label: getMemberName(value) || value,
      value
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

    $q.dialog({
      component: SelectDialog,
      componentProps: {
        title: t("addTeamMember"),
        okButtonLabel: t("addTeamMember"),
        selectOptions
      }
    }).onOk((userId: string) => 
      accountStore.teamHandle?.changeDoc(team => team.members.push(userId))
    );
  }
}

function removeFromTeam(userId: string) {
  if (!accountStore.team) {
    return;
  }

  accountStore.teamHandle?.changeDoc(team => {
    deleteItems(team.members, id => id == userId);
    deleteItems(team.admins, id => id == userId);
  });
}

function toggleAdminRole(userId: string) {
  if (isSingleAdmin(userId)) {
      return presentSingleAdminError();
  }

  if (hasAdminRole(userId)) {
    accountStore.teamHandle?.changeDoc(team => 
      deleteItems(team.admins, id => id == userId)
    );
  } else {
    accountStore.teamHandle?.changeDoc(team => 
      team.admins.push(userId)
    );
  }
}

function presentSingleAdminError() {
  $q.dialog({
    title: t("oneAdminRequiredErrorTitle"),
    message: t("oneAdminRequiredErrorMessage"),
    ...infoDialog
  });
}

function deleteTeam() {
  const team = accountStore.team;
  if (team) {
    let deletionImpossibleMessage;

    if (team.members.find(id => !membersInAdditionalTeams.value.has(id))) {
      deletionImpossibleMessage = t("membersHaveOnlyThisTeamMessage");
    } else if (accountStore.organization?.teams.length == 1) {
      deletionImpossibleMessage = t("singleTeamMessage");
    }

    if (deletionImpossibleMessage) {
      $q.dialog({
        title: t("teamDeletionNotPossibleTitle"),
        message: deletionImpossibleMessage,
        ...infoDialog
      });
    } else {
      confirmDeletionWarning(t("confirmTeamDeletionMessage", {name: team.name}))
      .onOk(() => {
        if (accountStore.authTeam) {
          accountStore.organizationHandle?.changeDoc(doc => {
            deleteItems(doc.teams, id => id == team.id);
          });
          removeDocument(team.id, accountStore.authTeam);
        }
      });
    }
  }
}

</script>
