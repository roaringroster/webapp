import { Ref, WatchSource, ref, watch } from "vue";
import {next as A, ChangeFn, ChangeOptions, Doc} from "@automerge/automerge";
import { Repo, isValidAutomergeUrl, DocHandleChangePayload, PeerId, DocumentId, stringifyAutomergeUrl, NetworkAdapter, DocHandle } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { AuthProvider, ShareId, getShareId } from "@localfirst/auth-provider-automerge-repo";
import { AuthenticatedNetworkAdapter } from "@localfirst/auth-provider-automerge-repo/dist/AuthenticatedNetworkAdapter";
import * as Auth from "@localfirst/auth";
import { eventPromise } from "@localfirst/shared";
import { useChangeHistoryStore } from "src/stores/changeHistoryStore";
import { i18n } from "src/boot/i18n";
import { LocalAccount, PartialLocalAccount, useAccount } from "src/api/local2";
import { promiseForErrorHandling } from "src/helper/utils";

// import { useAPI } from "src/api";
import * as AppSettings from "src/database/AppSettings";
import { User, createUser } from "src/models/user";
import { createOrganization, Organization } from "src/models/organization";
import { createTeam, Team } from "src/models/team";
// import { createContact } from "src/models/contact";
// import { createWorkAgreements } from "src/models/workAgreements";
// import { createAvailabilityList } from "src/models/availability";
// import { createAbsenceList } from "src/models/absence";

const { t } = i18n;

const staticRepo = new Repo({
  network: [],
  // network: [new BrowserWebSocketClientAdapter("wss://localhost:3030")],
  storage: new IndexedDBStorageAdapter("rr_demo"),
});
const dbPrefix = "account.";

type AuthRepo = {
  repo: Repo;
  auth: AuthProvider;
  network: AuthenticatedNetworkAdapter<NetworkAdapter>[];
};

let authRepo: AuthRepo | undefined = undefined;
export const isConnected = ref(false);
// const maxAutoReconnectAttempts = 3;
// const autoReconnectAttempts = 0;

export async function registerOrganization(account: LocalAccount, name: string) {
  const { auth, repo, network } = await initializeAuthRepo(account);
  const authTeam = await auth.createTeam(name);
  const shareId = getShareId(authTeam);
  const websocketServer = account.settings.defaultWebsocketServer;
  const organization = { shareId, websocketServer };
  await setAuthRepo({ auth, repo, network });

  const member = createUser(repo);
  const members: Record<string, User> = {};
  members[account.user?.userId] = member;

  const admins = [account.user?.userId];
  const team = createTeam({name: t("newTeam"), members, admins});
  const teamHandle = repo.create<Team>();
  const teamDocId = teamHandle.documentId;
  teamHandle.change((doc: DocumentId) => 
    Object.assign(doc, team)
  );

  const teams = [{ docId: teamDocId }];
  const orgHandle = repo.create<Organization>();
  orgHandle.change((doc: Organization) => 
    Object.assign(doc, createOrganization({ name, members, teams }))
  );

  authTeam.addMessage({ type: "ROOT_DOCUMENT_ID", payload: orgHandle.documentId });
  addDocument(authTeam, orgHandle.documentId);
  addDocument(authTeam, teamHandle.documentId);
  addDocument(authTeam, member.contactId);
  addDocument(authTeam, member.workAgreementsId);
  addDocument(authTeam, member.availabilityId);
  addDocument(authTeam, member.absencesId);
  
  return { team, organization, teamDocId };
}

export async function joinOrganization(account: PartialLocalAccount, invitationCode: string) {
  return promiseForErrorHandling(async reject => {
    const shareId = invitationCode.slice(0, 12) as ShareId;
    const websocketServer = account.settings.defaultWebsocketServer;
    const organization = { shareId, websocketServer };
    const invitationSeed = invitationCode.slice(12, 28) as Auth.Base58;
    // if there is no user yet during device admission to team, the username is in userId of device
    const userName = account.user?.userName || account.device.userId;
    let teamDocId: DocumentId | undefined = undefined;

    const { auth, repo, network } = await initializeAuthRepo(account);
    await setAuthRepo({ auth, repo, network });

    auth.on("localError", event => {
      console.error("joinTeamLocalError", event);
      reject(event.type);
      // types: TIMEOUT
    });
    auth.on("remoteError", event => {
      console.error("joinTeamRemoteError", event);
      reject(event.type);
      // types: INVITATION_PROOF_INVALID, TIMEOUT
    });

    await auth.addInvitation({ shareId, invitationSeed, userName });
    const user = await new Promise<Auth.User>(resolve => {
      auth.once("joined", ({ user }) => resolve(user));
    });

    const team = auth.getTeam(shareId);

    if (!team) {
      console.error("no team");
      throw new Error("GenericError");
    }

    // a new member is admitted and not just a new device
    if (account.user != undefined) {
      const documentId = getRootDocumentId(team);

      if (!documentId) {
        console.error("no team document: missing id");
        throw new Error("GenericError");
      }

      const handle = repo.find<Organization>(documentId);
      await handle?.whenReady();
      const member = createUser(repo);
      handle.change((doc: Organization) => doc.members[user.userId] = member);

      // ToDo: needs to be removed or updated when user is assigned to a team before or after joining an organization
      const doc = await handle.doc() as Doc<Organization>;
      teamDocId = Object.values(doc.teams).at(0)?.docId;
      if (teamDocId) {
        const teamHandle = repo.find<Team>(teamDocId);
        teamHandle.change((doc: Team) => doc.members[user.userId] = member);
      }

      addDocument(team, member.contactId);
      addDocument(team, member.workAgreementsId);
      addDocument(team, member.availabilityId);
      addDocument(team, member.absencesId);
    }

    return { team, organization, user, teamDocId };
  });
}

if (process.env.DEV) {
  (window as any).getOrganization = getOrganization;
}

async function initializeAuthRepo(account: PartialLocalAccount) {
  const {user, device, settings} = account;
  const server = settings.defaultWebsocketServer;
  // if there is no user yet during device admission to team, the username is in userId of device
  const username = user?.userName || device.userId;

  const storage = new IndexedDBStorageAdapter(dbPrefix + username);
  const auth = new AuthProvider({ user, device, storage, server });
  const httpProtocol = window.location.protocol;
  const wsProtocol = httpProtocol == "http:"
    ? "ws:"
    : "wss:";
  const networkAdapter = new BrowserWebSocketClientAdapter(`${wsProtocol}//${server}`);
  const authNetworkAdapter = auth.wrap(networkAdapter as unknown as NetworkAdapter);
  const network = [authNetworkAdapter];

  // Create new repo with websocket adapter
  const repo = new Repo({
    peerId: device.deviceId as PeerId,
    network,
    storage,
  });

  // Prevent the offline banner to be shown on login. 
  // Instead wait for (dis-)connected events and react accordingly.
  isConnected.value = true;
  auth.on("localError", payload => console.log("RR:localError", payload))
  auth.on("remoteError", payload => console.log("RR:remoteError", payload))
  auth.on("disconnected", payload => console.log("RR:disconnected", payload))
  auth.on("connected", payload => console.log("RR:connected", payload))
  auth.on("ready", () => console.log("RR:ready"))
  auth.on("joined", payload => console.log("RR:joined", payload))

  auth.on("joined", () => isConnected.value = true);
  auth.on("connected", () => {
    isConnected.value = true;

    // if (autoReconnectAttempts > 0) {
    //   setTimeout(() => {
    //     if (isConnected.value) {
    //       autoReconnectAttempts = 0;
    //     }
    //   }, 10_000);
    // }
  });
  auth.on("disconnected", () => {
    isConnected.value = false;

    // setTimeout(async () => {
    //   if (!isConnected.value && autoReconnectAttempts < maxAutoReconnectAttempts) {
    //     autoReconnectAttempts++;
    //     console.log("attempt", autoReconnectAttempts);
    //     await reconnect(account);
    //   }
    // }, 500);
  });

  await Promise.all([
    eventPromise(auth, "ready"), // auth provider has loaded any persisted state
    eventPromise(repo.networkSubsystem, "ready"), // repo has a working network connection
  ])

  return { auth, repo, network }
}

export async function reconnect(account?: PartialLocalAccount) {
  console.log("RECONNECT")
  if (!account && !!currentAccount.value) {
    account = currentAccount.value;
  }

  if (account) {
    await loginWithAuth(account);
  }
}

async function setAuthRepo(value?: AuthRepo) {
  if (authRepo != undefined) {
    console.log("removeAllListeners")
    authRepo.auth.removeAllListeners();
    authRepo.repo.removeAllListeners();
    authRepo.network.forEach(network => network.disconnect());
  }

  authRepo = value;
}

export async function loginWithAuth(account: PartialLocalAccount) {
  await setAuthRepo(await initializeAuthRepo(account));
}

export async function logoutWithAuth() {
  await setAuthRepo();
}

export function getAuth() {
  return authRepo?.auth;
}

export function getRepo() {
  return authRepo?.repo;
}

export async function deleteStorage(username: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbPrefix + username);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event);
    request.onblocked = (event) => reject(event);
  })
}

export function getOrganization() {
  // console.log("getOrganization", currentAccount.value, currentAccount.value?.activeOrganization);
  if (currentAccount.value?.activeOrganization) {
    // console.log("1", authRepo, authRepo?.auth.getTeam(currentAccount.value?.activeOrganization));
    return authRepo?.auth.getTeam(currentAccount.value?.activeOrganization) || null;
  } else {
    return null;
  }
}

type TeamMessage = {
  type: "ROOT_DOCUMENT_ID";
  payload: DocumentId;
}

export function getRootDocumentId(team: Auth.Team) {
  return team
    .messages<TeamMessage>()
    .filter(message => message.type === "ROOT_DOCUMENT_ID")
    .pop()?.payload;
}

export function getOrganizationOrThrow() {
  const team = getOrganization();

  if (!team) {
    throw new Error("UserHasNoOrganization");
  }

  if (!getRootDocumentId(team)) {
    throw new Error("GenericError");
  }

  return team;
}

function getShareForTeam(team: Auth.Team) {
  const shareId = getShareId(team);
  return authRepo?.auth.getShare(shareId);
}

export function addDocument(team: Auth.Team, id: DocumentId) {
  getShareForTeam(team)?.documentIds?.add(id);
}

export function removeDocument(team: Auth.Team, id: DocumentId) {
  getShareForTeam(team)?.documentIds?.delete(id);
  authRepo?.repo.delete(id);
}


/**
 * Returns a handle with a reactive document and change function for the 
 * Automerge document with the given id. The method cleanup needs to be 
 * called when the handle is no longer needed, e.g. when the calling component
 * is unmounted. Throws an error if used while no user is logged in.
 * @param id Automerge URL or Automerge DocumentId
 * @returns 
 */
export function useDocument2<T>(id: string) {
  if (!authRepo) {
    throw new Error("NotLoggedIn");
  }

  const doc: Ref<A.Doc<T> | null> = ref(null);

  const changeDoc = (
    changeFn: ChangeFn<T>,
    options: ChangeOptions<T> = changeOptions()
  ) => handle?.change(changeFn, options);

  const onChange = (h: DocHandleChangePayload<T>) => doc.value = h.doc;

  const cleanup = () => handle?.off("change", onChange)

  const documentId = isValidAutomergeUrl(id)
    ? id
    : stringifyAutomergeUrl(id as DocumentId);

  const handle = authRepo?.repo.find<T>(documentId);
  handle?.doc()
    .then(value => doc.value = value)
    .catch(console.error)
  handle?.on("change", onChange);

  return { doc, docId: id as DocumentId, changeDoc, cleanup, handle }
}

export function useDocuments<T>(docIdList: string[]) {
  return docIdList.map(docId => useDocument2<T>(docId));
}

type HasHandle<T> = {
  cleanup: () => DocHandle<T>
  handle: DocHandle<T>
}

export async function whenReady(handles: HasHandle<any>[]) {
  return await Promise.all(handles.map(handle => handle.handle.whenReady()));
}

export function cleanupAll(handles: HasHandle<any>[]) {
  handles.forEach(({ cleanup }) => cleanup());
}

/** @deprecated */
export function useDocument<T>(id: string | Promise<string>) {
  const getId = typeof id == "string"
    ? Promise.resolve(id)
    : id;

  const doc: Ref<A.Doc<T> | null> = ref(null);

  const changeDoc = (
    changeFn: ChangeFn<T>,
    options: ChangeOptions<T> = changeOptions()
  ) => handle?.change(changeFn, options);

  const onChange = (h: DocHandleChangePayload<T>) => doc.value = h.doc;

  const cleanup = () => handle?.off("change", onChange)

  let handle: DocHandle<T> | undefined;

  getId
    .then(id => {
      if (isValidAutomergeUrl(id)) {
        handle = staticRepo.find<T>(id);

        handle.doc()
          .then(value => doc.value = value)
          .catch(console.error)

        handle.on("change", onChange);
      }
    })
    .catch(console.error)

  return { doc, changeDoc, cleanup }
}


export function useChangeHistory<T>(source: WatchSource<A.Doc<T> | null>, title: string) {
  const changeHistoryStore = useChangeHistoryStore();

  watch(
    source,
    (document) => {
      if (document) {
        changeHistoryStore.documents = [{ document, title }];
      } else {
        changeHistoryStore.documents = [];
      }
    }
  );
}


export function useOrganizationDocument() {
  const team = getOrganization();

  if (!team) {
    throw new Error("UserHasNoOrganization");
  }

  const docId = getRootDocumentId(team);

  if (!docId) {
    throw new Error("GenericError");
  }

  const handle = useDocument2<Organization>(docId);

  // if (process.env.DEV) {
  //   handle.handle.whenReady().then(() => {
  //     if (Object.keys(handle.doc.value?.members).length == 0) {
  //       console.log("add user documents", handle.doc.value);
  //       const repo = authRepo.repo
  //       const user = createUser(repo);
  //       const members = {};
  //       members[account.value.user.userId] = user;
  //       handle.changeDoc(doc => Object.assign(doc, createTeam({members})));
  //       addDocument(team, user.contactId);
  //       addDocument(team, user.workAgreementsId);
  //       addDocument(team, user.availabilityId);
  //       addDocument(team, user.absencesId);
  //     } else {
  //       console.log("update user documents", handle.doc.value);
  //       const member = handle.doc.value.members[Object.keys(handle.doc.value.members).at(0)];
  //       const contact = useDocument2(member.contactId);
  //       contact.handle.whenReady().then(() => {
  //         contact.changeDoc(doc => Object.assign(doc, createContact()));
  //         contact.cleanup();
  //       });
  //       const workAgreements = useDocument2(member.workAgreementsId);
  //       workAgreements.handle.whenReady().then(() => {
  //         workAgreements.changeDoc(doc => Object.assign(doc, createWorkAgreements()));
  //         workAgreements.cleanup();
  //       });
  //       const availability = useDocument2(member.availabilityId);
  //       availability.handle.whenReady().then(() => {
  //         availability.changeDoc(doc => Object.assign(doc, createAvailabilityList()));
  //         availability.cleanup();
  //       });
  //       const absences = useDocument2(member.absencesId);
  //       absences.handle.whenReady().then(() => {
  //         absences.changeDoc(doc => Object.assign(doc, createAbsenceList()));
  //         absences.cleanup();
  //       });
  //     }
  //   })
  // }

  return handle;
}

// const api = useAPI();
const { getAccountRef } = useAccount();
const currentAccount = getAccountRef();

export function changeOptions(
  // userId = api.username || "",
  userId = currentAccount.value?.user.userId || "",
  time = Math.floor(Date.now() / 1000)
) {
  const message = JSON.stringify({ by: userId });
  return { time, message };
}

/** only for debug purposes (can be deleted) */
export async function findOrCreate<T>(id: string, initialValue: T) {
  const docUrl = await AppSettings.get<string | undefined>(id as "lastUpdated");

  let handle: DocHandle<T>;

  if (isValidAutomergeUrl(docUrl)) {
    handle = staticRepo.find(docUrl)
  } else {
    handle = staticRepo.create();
    handle.change(
      (doc: A.Doc<T>) => Object.assign(doc, initialValue), 
      changeOptions()
    );
    await AppSettings.set(id as "lastUpdated", handle.url)
  }

  return handle.url;
}
