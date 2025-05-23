import { Ref, WatchSource, ref, toRaw, watch } from "vue";
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
import { getCaseSensitiveUsername, LocalAccount, PartialLocalAccount, useAccount } from "src/api/local2";
import { promiseForErrorHandling } from "src/helper/utils";

// import { useAPI } from "src/api";
import { HasDocumentId } from "src/models/base";
import { Member, createMember } from "src/models/user";
import { createOrganization, Organization } from "src/models/organization";
import { createTeam, Team } from "src/models/team";
import Dexie from "dexie";
// import { createContact } from "src/models/contact";
// import { createWorkAgreements } from "src/models/workAgreements";
// import { createAvailabilityList } from "src/models/availability";
// import { createAbsenceList } from "src/models/absence";

const { t } = i18n;

const dbPrefix = "account.";

export type AuthTeam = Auth.Team;

type AuthRepo = {
  repo: Repo;
  auth: AuthProvider;
  network: AuthenticatedNetworkAdapter<NetworkAdapter>[];
};

let authRepo: AuthRepo | undefined = undefined;
export const isConnected = ref(false);
// const maxAutoReconnectAttempts = 3;
// const autoReconnectAttempts = 0;

export async function registerOrganization(account: LocalAccount, name: string, server: string) {
  const { user, device, settings } = account;
  const websocketServer = server || settings.defaultWebsocketServer;
  const keys = await getServerKeys(websocketServer);
  const authTeam = await Auth.createTeam(name, { device, user });
  const shareId = getShareId(authTeam);
  const organization = { shareId, websocketServer };
  const { hostname } = new URL(`http://${websocketServer}`);
  authTeam.addServer({ host: hostname, keys });
  await postOrganization(websocketServer, authTeam);
  const url = `${websocketServer}/${shareId}`;

  const { auth, repo, network } = await initializeAuthRepo(account, url);
  setAuthRepo({ auth, repo, network });

  await auth.addTeam(authTeam);
  const member = createMember(authTeam);
  const members: Record<string, Member> = {};
  members[account.user?.userId] = member;

  const admins = [account.user?.userId];
  const team = createTeam({name: t("newTeam") + " 1", members: Object.keys(members), admins}, authTeam);
  const teamId = createDocument(team, authTeam);

  const teams = [teamId];
  const organizationId = createDocument(createOrganization({ name, members, teams }), authTeam);

  authTeam.addMessage({ type: "ROOT_DOCUMENT_ID", payload: organizationId });
  
  return { team, organization, teamId };
}

export async function joinOrganization(account: PartialLocalAccount, invitationCode: string, server: string) {
  return promiseForErrorHandling(async reject => {
    const shareId = invitationCode.slice(0, 12) as ShareId;
    const websocketServer = server || account.settings.defaultWebsocketServer;
    const url = `${websocketServer}/${shareId}`;
    const organization = { shareId, websocketServer };
    const invitationSeed = invitationCode.slice(12, 28) as Auth.Base58;
    // if there is no user yet during device admission to team, the username is in userId of device
    const userName = account.user?.userName || account.device.userId;
    let teamId: DocumentId | undefined = undefined;

    const { auth, repo, network } = await initializeAuthRepo(account, url);
    setAuthRepo({ auth, repo, network });

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

    const authTeam = auth.getTeam(shareId);

    if (!authTeam) {
      console.error("no team");
      throw new Error("GenericError");
    }

    // a new member is admitted and not just a new device
    if (account.user != undefined) {
      const documentId = getRootDocumentId(authTeam);

      if (!documentId) {
        console.error("no team document: missing id");
        throw new Error("GenericError");
      }

      const handle = repo.find<Organization>(documentId);
      await handle?.whenReady();
      const member = createMember(authTeam);
      handle.change((doc: Organization) => doc.members[user.userId] = member);

      // ToDo: needs to be removed or updated when user is assigned to a team before or after joining an organization
      const doc = await handle.doc() as Doc<Organization>;
      teamId = Object.values(doc.teams).at(0);
      if (teamId) {
        const teamHandle = repo.find<Team>(teamId);
        await teamHandle.whenReady();
        teamHandle.change((doc: Team) => {
          doc.members.push(user.userId);
        });
      }
    }

    return { organization, user, teamId };
  });
}

async function initializeAuthRepo(account: PartialLocalAccount, server: string) {
  const { user, device, activeOrganization } = account;
  // if there is no user yet during device admission to team, the username is in userId of device
  const username = user?.userName || device.userId;
  const dbName = dbPrefix + (await getCaseSensitiveUsername(username, dbPrefix) || username);

  const storage = new IndexedDBStorageAdapter(dbName);
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
  auth.on("peer-joined", payload => console.log("RR:peer-joined", payload))

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

  // if we have no server connection after a few seconds, the server might have lost
  // the shareId and team graph of our organization Auth team, so we send it if needed.
  // We should only do that when using BrowserWebSocketClientAdapter.
  auth.on("peer-joined", () => clearTimeout(peerJoinedTimeout));
  const peerJoinedTimeout = setTimeout(async () => {
    if (activeOrganization && auth.hasTeam(activeOrganization)) {
      const serverBaseUrl = new URL("http://" + server).host;
      const authTeam = auth.getTeam(activeOrganization);
      const serverKeysLocal = authTeam.servers(serverBaseUrl)?.keys;
      const serverKeysRemote = await getServerKeys(serverBaseUrl);

      // we already know the server and it's public keys, but it might be necessary
      // to register our organization Auth team again
      if (!!serverKeysRemote?.encryption 
        && serverKeysRemote.encryption == serverKeysLocal.encryption
        && serverKeysRemote.signature == serverKeysLocal.signature
      ) {
        await postOrganization(serverBaseUrl, authTeam);
      }
    }
  }, 5000);

  await Promise.all([
    eventPromise(auth, "ready"), // auth provider has loaded any persisted state
    eventPromise(repo.networkSubsystem, "ready"), // repo has a working network connection
  ])

  return { auth, repo, network }
}

async function getServerKeys(server: string) {
  const response = await fetch(`https://${server}/keys`);
  return await response.json() as Auth.Keyset;
}

async function postOrganization(server: string, organization: Auth.Team) {
  return await fetch(`https://${server}/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serializedGraph: organization.save(),
      teamKeyring: organization.teamKeyring(),
    }),
  });
}

export async function reconnect(account?: PartialLocalAccount) {
  console.log("RECONNECT", account);
  await Promise.resolve();
  // if (!account && !!currentAccount.value) {
  //   account = currentAccount.value;
  // }

  // if (account) {
  //   await loginWithAuth(account);
  // }
}

function setAuthRepo(value?: AuthRepo) {
  if (authRepo != undefined) {
    // console.log("removeAllListeners");
    authRepo.auth.removeAllListeners();
    authRepo.repo.removeAllListeners();
    authRepo.network.forEach(network => network.disconnect());
  }

  authRepo = value;
}

export async function loginWithAuth(account: PartialLocalAccount) {
  const { organizations, activeOrganization } = account;
  const organization = organizations.find(({ shareId }) => shareId == activeOrganization);
  const { websocketServer } = organization || {};

  if (!activeOrganization || !organization) {
    throw new Error("OrganizationMissing");
  }

  if (!websocketServer) {
    throw new Error("ServerMissing");
  }
  
  const url = `${websocketServer}/${activeOrganization}`;
  setAuthRepo(await initializeAuthRepo(account, url));
}

export function logoutWithAuth() {
  setAuthRepo();
}

export function loginWithDemo(value: AuthRepo) {
  isConnected.value = true;
  setAuthRepo(value);
}

export function getAuth() {
  return authRepo?.auth;
}

export function getRepo() {
  return authRepo?.repo;
}

export async function deleteStorage(username: string) {
  if (!username) {
      throw new Error("UsernameMissing")
  }

  const caseSensitiveUsername = await getCaseSensitiveUsername(username, dbPrefix);
  const name = dbPrefix + caseSensitiveUsername;

  if (!caseSensitiveUsername || !await Dexie.exists(name)) {
      throw new Error("UsernameDoesNotExist")
  }

  /*
  For the following code to work and not being blocked, automerge-repo-storage-indexeddb
  needs to close the db on versionchange event in it's createDatabasePromise method:

  request.onsuccess = event => {
      const db = event.target.result;
      db.onversionchange = function() {
          db.close()
      }
      resolve(db);
  };

  source: https://dev.to/ivandotv/handling-indexeddb-upgrade-version-conflict-368a 
    (via https://github.com/dexie/Dexie.js/issues/1779)
  */
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbPrefix + username);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error());
    request.onblocked = () => reject(new Error());
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

// function getShareForTeam(team: Auth.Team) {
//   const shareId = getShareId(team);
//   return authRepo?.auth.getShare(shareId);
// }


export function createDocument<T extends object>(initialValue: T, team: Auth.Team) {
  if (!authRepo) {
    throw new Error("NotLoggedIn");
  }

  const handle = authRepo.repo.create<T>();
  handle.change((doc: T) => 
    Object.assign(doc, initialValue)
  );

  addDocument(handle.documentId, team);

  return handle.documentId;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addDocument(id: DocumentId, team: Auth.Team) {
  // getShareForTeam(team)?.documentIds?.add(id);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function removeDocument(id: DocumentId, team: Auth.Team) {
  // getShareForTeam(team)?.documentIds?.delete(id);
  authRepo?.repo.delete(id);
}

type Handle<T> = {
  doc: Ref<A.Doc<T> | null>;
  docId: DocumentId
  cleanup: () => void;
  handle: DocHandle<T>;
};

/**
 * Returns a handle with a reactive document and change function for the 
 * Automerge document with the given id. The method cleanup needs to be 
 * called when the handle is no longer needed, e.g. when the calling component
 * is unmounted. Throws an error if used while no user is logged in.
 * @param id Automerge URL or Automerge DocumentId
 * @returns 
 */
export function useDocument<T>(id: string) {
  if (!authRepo) {
    throw new Error("NotLoggedIn");
  }

  const doc: Ref<A.Doc<T> | null> = ref(null);

  const changeDoc = (
    changeFn: ChangeFn<T>,
    options: ChangeOptions<T> = changeOptions()
  ) => handle?.change(changeFn, options);

  const onChange = (h: DocHandleChangePayload<T>) => doc.value = h.doc;

  const cleanup = () => {
    handle?.off("change", onChange)
  };

  const documentId = isValidAutomergeUrl(id)
    ? id
    : stringifyAutomergeUrl(id as DocumentId);

  const handle = authRepo?.repo.find<T>(documentId);
  handle?.doc()
    .then(value => doc.value = value || null)
    .catch(console.error)
  handle?.on("change", onChange);

  return { doc, docId: id as DocumentId, changeDoc, cleanup, handle }
}

export function useDocuments<T>(docIdList: string[] = []) {
  return docIdList.map(docId => useDocument<T>(docId));
}

export function getDocuments<T>(handles: Handle<T>[] = []) {
  return handles.flatMap(({ doc, docId: id }) =>
      doc?.value
        ? [{ ...doc.value, id }]
        : []
    );
}

type HasCleanup = {
  cleanup: () => void;
};

type HasHandle<T> = HasCleanup & {
  handle: DocHandle<T>;
};

export async function whenReady(handles: HasHandle<any>[]) {
  return await Promise.all(toRaw(handles).map(handle => handle.handle.whenReady()));
}

export function cleanupAll(handles: HasCleanup[]) {
  handles.forEach(({ cleanup }) => cleanup());
}

export function getHandles<T>(source: WatchSource<string[] | undefined>) {
  const handles: Ref<ReturnType<typeof useDocuments<T>>> = ref([]);
  watch(
    source,
    value => {
      cleanupAll(handles.value);
      handles.value = useDocuments<T>(value);
    },
    { immediate: true }
  );
  return handles;
}

export function getDocumentsWhenReady<T>(handlesRef: Ref<Handle<T>[]>) {
  const documents: Ref<(T & HasDocumentId)[]> = ref([]);
  watch(
    () => handlesRef.value.map(({ doc }) => doc),
    value => {
      if (value.every(Boolean)) {
        documents.value = handlesRef.value.flatMap(({ doc, docId: id }) =>
          doc 
            ? [{ ...(doc as T), id }]
            : []
        );
      }
    },
    { immediate: true }
  );
  return documents;
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
  const team = getOrganizationOrThrow();
  const documentId = getRootDocumentId(team);

  if (!documentId) {
    throw new Error("GenericError");
  }

  const handle = useDocument<Organization>(documentId);

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
