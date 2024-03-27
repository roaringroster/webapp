import { Ref, WatchSource, ref, watch } from "vue";
import {next as A, ChangeFn, ChangeOptions} from "@automerge/automerge";
import { Repo, isValidAutomergeUrl, DocHandle, DocHandleChangePayload, PeerId } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { AuthProvider, ShareId } from "@localfirst/auth-provider-automerge-repo";
import { createUser, createDevice, UserWithSecrets, DeviceWithSecrets } from "@localfirst/auth";
import { eventPromise } from "@localfirst/shared";
import { UAParser } from "ua-parser-js";
import { useChangeHistoryStore } from "src/stores/changeHistoryStore";
import { useAPI } from "src/api";
import * as AppSettings from "src/database/AppSettings";

const repo = new Repo({
  network: [],
  // network: [new BrowserWebSocketClientAdapter("wss://localhost:3030")],
  storage: new IndexedDBStorageAdapter("rr_demo"),
});

function getDeviceName() {
  const { browser, os, device } = UAParser(navigator.userAgent)
  return `${device.model ?? os.name} (${browser.name})`
}

export function getServerAddress() {
  const server = process.env.SYNC_SERVER;

  if (!server) {
    throw Error("FatalAppError");
  }

  return server;
}

export async function registerTeam(username: string, teamname: string) {
  const user = createUser(username);
  const device = createDevice(user.userId, getDeviceName());
  const server = getServerAddress();

  const { auth } = await initializeAuthRepo(user, device, server);
  const team = await auth.createTeam(teamname);
  
  return { team }
}

export async function joinTeam(username: string, teamId: ShareId, inviteCode: string) {
  const user = createUser(username);
  const device = createDevice(user.userId, getDeviceName());
  const server = getServerAddress();

  const { auth } = await initializeAuthRepo(user, device, server);

  await auth.addInvitation({
    shareId: teamId,
    invitationSeed: inviteCode,
  });
}

export function login(
  user: UserWithSecrets, 
  device: DeviceWithSecrets,
  server: string
) {
  return initializeAuthRepo(user, device, server);
}

async function initializeAuthRepo(
  user: UserWithSecrets, 
  device: DeviceWithSecrets,
  server: string
) {
  const storage = new IndexedDBStorageAdapter(user.userName);
  const auth = new AuthProvider({ user, device, storage, server });
  const httpProtocol = window.location.protocol;
  const wsProtocol = httpProtocol.replace("http", "ws");
  const networkAdapter = new BrowserWebSocketClientAdapter(`${wsProtocol}//${server}`)
  const authAdapter = auth.wrap(networkAdapter)

  // Create new repo with websocket adapter
  const repo = new Repo({
    peerId: device.deviceId as PeerId,
    network: [authAdapter],
    storage,
  })

  await Promise.all([
    eventPromise(auth, "ready"), // auth provider has loaded any persisted state
    eventPromise(repo.networkSubsystem, "ready"), // repo has a working network connection
  ])

  return { auth, repo }
}

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
        handle = repo.find<T>(id);

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

const api = useAPI();

export function changeOptions(
  userId = api.username || "",
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
    handle = repo.find(docUrl)
  } else {
    handle = repo.create();
    handle.change(
      (doc: A.Doc<T>) => Object.assign(doc, initialValue), 
      changeOptions()
    );
    await AppSettings.set(id as "lastUpdated", handle.url)
  }

  return handle.url;
}
