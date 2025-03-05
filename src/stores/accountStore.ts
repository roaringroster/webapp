import { defineStore } from "pinia";
import { computed, ref, Ref, watch } from "vue";
import { ChangeFn, ChangeOptions, Doc } from "@automerge/automerge";
import { DocHandle, DocumentId } from "@automerge/automerge-repo";
import { Team as AuthTeam } from "@localfirst/auth";
import { useAccount } from "src/api/local2";
import { cleanupAll, getOrganization, updateHandles, useDocument2 as useDocument, useOrganizationDocument } from "src/api/repo";
import { Contact, getUsername } from "src/models/contact";
import { Team } from "src/models/team";
import { Organization } from "src/models/organization";

const { getAccountRef, updateAccount, updateDeviceSettings } = useAccount();

export type StoredHandle<T> = {
  doc: Doc<T> | null;
  docId: DocumentId;
  changeDoc: (changeFn: ChangeFn<T>, options?: ChangeOptions<T>) => void;
  cleanup: () => void;
  handle: DocHandle<T>;
};

export const useAccountStore = defineStore("account", () => {
  const account = getAccountRef();
  const authTeam: Ref<AuthTeam | null> = ref(null);
  const organizationHandle: Ref<StoredHandle<Organization> | null> = ref(null);
  const memberContactHandle: Ref<StoredHandle<Contact> | null> = ref(null);
  const teamHandles: Ref<StoredHandle<Team>[]> = ref([]);

  const userId = computed(() => account.value?.user.userId || "");
  const userName = computed(() => account.value?.user.userName || "");
  const organization = computed(() => 
    organizationHandle.value?.doc
  );
  const member = computed(() => 
    organization.value?.members[userId.value]
  );
  const memberContact = computed(() => 
    memberContactHandle.value?.doc
  );
  const memberName = computed(() => 
    getUsername(memberContact.value || undefined) || userName
  );
  const allTeams = computed(() =>
    teamHandles.value.flatMap(({ doc, docId: id }) =>
      !!doc 
        ? [{ ...doc, id }]
        : []
    )
  );
  const teams = computed(() =>
    allTeams.value.filter(team => team?.members.includes(userId.value))
  );
  const teamHandle = computed(() => 
    (teamHandles.value.find(({ docId, doc }) => 
      docId == account.value?.activeTeam 
        && doc?.members.includes(userId.value)
    ) || null)
  );
  const team = computed(() => 
    teamHandle.value?.doc
      ? { ...teamHandle.value.doc, id: teamHandle.value.docId }
      : null
  );

  updateHandles(() => organization.value?.teams, teamHandles);

  // if user has no active team (because he left, it was deleted or whatever), assign one
  watch(
    [team, teams],
    ([team, teams]) => {
      if (!team && teams.length > 0 && teamHandles.value.length == teams.length) {
        updateAccount(account => account.activeTeam = teams.at(0)?.id);
      }
    }
  );

  async function login() {
    authTeam.value = getOrganization();
    const orgHandle = useOrganizationDocument() as unknown as StoredHandle<Organization>;
    await orgHandle.handle.whenReady();
    organizationHandle.value = orgHandle;

    if (member.value) {
      memberContactHandle.value = 
        useDocument(member.value.contactId) as unknown as StoredHandle<Contact>;
    }
  }

  async function logout() {
    authTeam.value = null;
    organizationHandle.value?.cleanup();
    organizationHandle.value = null;
    memberContactHandle.value?.cleanup();
    memberContactHandle.value = null;
    cleanupAll(teamHandles.value);
    teamHandles.value = [];
  }

  return {
    account,
    authTeam,
    organizationHandle,
    memberContactHandle,
    teamHandle,
    allTeamHandles: teamHandles,

    userId,
    userName,
    organization,
    member,
    memberName,
    memberContact,
    teams,
    team,

    login,
    logout,
    updateAccount,
    updateDeviceSettings,
  }
});
