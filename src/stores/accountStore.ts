import { defineStore } from "pinia";
import { computed, ref, Ref, toRaw, watch } from "vue";
import { ChangeFn, ChangeOptions, Doc } from "@automerge/automerge";
import { DocHandle, DocumentId } from "@automerge/automerge-repo";
import { Team as AuthTeam } from "@localfirst/auth";
import * as AppSettings from "src/database/AppSettings";
import { useAccount } from "src/api/local2";
import { cleanupAll, getOrganization, getHandles, useDocument, useOrganizationDocument } from "src/api/repo";
import { migrateSchemas } from "src/helper/schemaMigration";
import { Contact, getUsername } from "src/models/contact";
import { Team } from "src/models/team";
import { Organization } from "src/models/organization";
import { DeviceInfo, DeviceList } from "src/models/deviceList";
import { CustomFieldListType, customValue, updateOrAddCustomField } from "src/models/generic";
import { automergeClone, deepMerge, equals } from "src/models/base";
import { getDevice } from "src/helper/appInfo";

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
  const isOrganizationAdmin = ref(false);

  const organizationHandle: Ref<StoredHandle<Organization> | null> = ref(null);
  const deviceListHandle: Ref<StoredHandle<DeviceList> | null> = ref(null);
  const memberContactHandle: Ref<StoredHandle<Contact> | null> = ref(null);

  const userId = computed(() => account.value?.user.userId || "");
  const userName = computed(() => account.value?.user.userName || "");
  const deviceId = computed(() => account.value?.device.deviceId || "");
  const organization = computed(() => 
    organizationHandle.value?.doc
  );
  const deviceList = computed(() => 
    deviceListHandle.value?.doc
  );
  const member = computed(() => 
    organization.value?.members[userId.value]
  );
  const memberContact = computed(() => 
    memberContactHandle.value?.doc
  );
  const memberName = computed(() => 
    getUsername(memberContact.value || undefined) || userName.value
  );
  const allTeams = computed(() =>
    teamHandles.value.flatMap(({ doc, docId: id }) =>
      doc 
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
  const isTeamAdmin = computed(() => 
    team.value?.admins.includes(userId.value) || false
  );

  const teamHandles = getHandles<Team>(() => organization.value?.teams) as unknown as Ref<StoredHandle<Team>[]>;

  // if user has no active team (because he left, it was deleted or whatever), assign one
  watch(
    [team, teams],
    async ([team, teams]) => {
      if (!team && teams.length > 0 && teamHandles.value.length == teams.length) {
        await updateAccount(account => account.activeTeam = teams.at(0)?.id);
      }
    }
  );

  function onTeamUpdated() {
    isOrganizationAdmin.value = !!userId.value
      && !!authTeam.value 
      && authTeam.value.has(userId.value) 
      && authTeam.value.memberIsAdmin(userId.value);
  }

  async function login(skipSchemaMigration = false) {
    if (!skipSchemaMigration) {
      await migrateSchemas();
    }

    authTeam.value = getOrganization();

    toRaw(authTeam.value)?.on("updated", onTeamUpdated);
    onTeamUpdated();

    // role migration code
    if (authTeam.value && isOrganizationAdmin.value) {
      if (!authTeam.value.hasRole("member")) {
        authTeam.value.addRole("member");
      }
      
      const membersWithRole = authTeam.value.membersInRole("member")
        .map(({ userId }) => userId);
      const membersWithoutRole = authTeam.value.members()
        .filter(member => !membersWithRole.includes(member.userId));

      if (membersWithoutRole.length) {
        membersWithoutRole.forEach(({ userId }) => 
          authTeam.value?.addMemberRole(userId, "member")
        );
        console.warn("members without role migrated", membersWithoutRole);
      }
    }

    const orgHandle = useOrganizationDocument() as unknown as StoredHandle<Organization>;
    await orgHandle.handle.whenReady();
    organizationHandle.value = orgHandle;

    if (member.value) {
      memberContactHandle.value = 
        useDocument(member.value.contactId) as unknown as StoredHandle<Contact>;
    }

    if (organization.value) {
      deviceListHandle.value = 
        useDocument(organization.value.deviceListId) as unknown as StoredHandle<DeviceList>;
    }

    const localDeviceId = await AppSettings.get<string>("localDeviceId");
    await toRaw(deviceListHandle.value)?.handle.whenReady();
    const device: Partial<DeviceInfo> | undefined = automergeClone(deviceList.value?.devices?.[localDeviceId]);
    delete device?.customName;

    if (!deviceList.value?.deviceMap[deviceId.value]) {
      deviceListHandle.value?.changeDoc(doc => {
        doc.deviceMap[deviceId.value] = localDeviceId;
      });
    }

    if (!equals(device, getDevice())) {
      deviceListHandle.value?.changeDoc(doc => {
        if (!doc.devices[localDeviceId]) {
          doc.devices[localDeviceId] = { ...getDevice(), customName: "" };
        } else {
          deepMerge(doc.devices[localDeviceId] || {}, getDevice());
        }
      });
    }
  }

  function logout() {
    toRaw(authTeam.value)?.off("updated", onTeamUpdated);
    authTeam.value = null;
    organizationHandle.value?.cleanup();
    organizationHandle.value = null;
    memberContactHandle.value?.cleanup();
    memberContactHandle.value = null;
    deviceListHandle.value?.cleanup();
    deviceListHandle.value = null;
    cleanupAll(teamHandles.value);
    teamHandles.value = [];
  }
  
  function equalsDefaultValues(doc: CustomFieldListType | null | undefined, values: Record<string, any>) {
    const map = customValue<Record<string, any>>(doc || undefined, "defaultValues") || {};
    return Object.entries(values).find(([key, value]) => map[key] != value) == undefined;
  }
  
  function setDefaultValues(doc: CustomFieldListType, values: Record<string, any>) {
    const map = customValue<Record<string, any>>(doc, "defaultValues") || {};
    deepMerge(map, values);
    updateOrAddCustomField(doc, "defaultValues", map);
  }

  function getDefaultValue<T>(doc: CustomFieldListType | null | undefined, label: string) {
    const map = customValue<Record<string, T>>(doc || undefined, "defaultValues") || {};
    return map[label];
  }

  function getLocalDefaultValue<T>(label: string) {
    return getDefaultValue<T>(account.value?.settings, label);
  }

  async function updateLocalDefaultValues(values: Record<string, any>) {
    if (!equalsDefaultValues(account.value?.settings, values)) {
      await updateDeviceSettings(doc => {
        setDefaultValues(doc, values);
      })
    }
  }

  // function getUserDefaultValue<T>(label: string) {
  //   return getDefaultValue<T>(memberSettings.value, label);
  // }

  // function updateUserDefaultValues(values: Record<string, any>) {
  //   if (!equalsDefaultValues(memberSettings.value, values)) {
  //     memberSettingsHandle.value?.changeDoc(doc => {
  //       setDefaultValues(doc, values);
  //     })
  //   }
  // }

  return {
    account,
    authTeam,
    organizationHandle,
    deviceListHandle,
    memberContactHandle,
    teamHandle,
    allTeamHandles: teamHandles,

    userId,
    userName,
    organization,
    deviceList,
    member,
    memberName,
    memberContact,
    teams,
    team,
    isTeamAdmin,
    isOrganizationAdmin,
    allTeams,

    login,
    logout,
    updateAccount,
    updateDeviceSettings,
    getLocalDefaultValue,
    updateLocalDefaultValues,
  }
});
