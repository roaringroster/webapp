import { Chunk, NetworkAdapter, PeerId, Repo, StorageAdapterInterface, StorageKey } from "@automerge/automerge-repo";
import { AuthProvider, getShareId } from "@localfirst/auth-provider-automerge-repo";
import { AuthenticatedNetworkAdapter } from "@localfirst/auth-provider-automerge-repo/dist/AuthenticatedNetworkAdapter";
import { eventPromise } from "@localfirst/shared";
import { LocalAccount, useAccount } from "./local2";
import { createDocument, getOrganizationOrThrow, loginWithDemo } from "./repo";
import { i18n } from "src/boot/i18n";
import { createMember, Member } from "src/models/user";
import { createTeam } from "src/models/team";
import { createOrganization } from "src/models/organization";
import { EncryptedDatabase } from "src/database/EncryptedDatabase";

const { registerAccount, loginDemo } = useAccount();
const { t } = i18n;

export async function initializeDemo(locale: string) {
  const name = "Demo";
  const account = await registerAccount(name, name, locale) as LocalAccount;
  const { user, device } = account;
  const userId = account.user?.userId || "";

  const storage = new MemoryStorageAdapter();
  const auth = new AuthProvider({ user, device, storage });
  const network: AuthenticatedNetworkAdapter<NetworkAdapter>[] = [];
  const repo = new Repo({
    peerId: device.deviceId as PeerId,
    network,
    storage,
  });

  await eventPromise(auth, "ready");
  
  const authTeam = await auth.createTeam(name);
  const shareId = getShareId(authTeam);
  const websocketServer = account.settings.defaultWebsocketServer;
  const organization = { shareId, websocketServer };
  await loginWithDemo({ auth, repo, network });

  const member = createMember(authTeam);
  const members: Record<string, Member> = {};
  members[userId] = member;

  const admins = [userId];
  const team = createTeam({name: t("newTeam") + " 1", members: Object.keys(members), admins}, authTeam);
  const teamId = createDocument(team, authTeam);

  const teams = [teamId];
  const organizationId = createDocument(createOrganization({ name, members, teams }), authTeam);

  authTeam.addMessage({ type: "ROOT_DOCUMENT_ID", payload: organizationId });

  account.organizations = [organization];
  account.activeOrganization = organization.shareId;
  account.activeTeam = teamId;
  
  await loginDemo(account, MemoryDatabase as unknown as typeof EncryptedDatabase);
  getOrganizationOrThrow();
}


class MemoryStorageAdapter implements StorageAdapterInterface {
  private data: { [key: string]: Uint8Array } = {};

  load(key: StorageKey) {
    return Promise.resolve(this.data[key.join(".")]);
  }

  save(key: StorageKey, data: Uint8Array) {
    this.data[key.join(".")] = data;
    return Promise.resolve();
  }

  remove(key: StorageKey) {
    delete this.data[key.join(".")];
    return Promise.resolve();
  }

  loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    throw new Error("Method not implemented.");
  }

  removeRange(keyPrefix: StorageKey): Promise<void> {
    throw new Error("Method not implemented.");
  }
}


class MemoryTable<T extends {id: string}> {
  private data: { [id: string]: T } = {};

  get(id: string) {
    return Promise.resolve(this.data[id]);
  }

  add(item: T) {
    this.data[item.id] = item;
    return Promise.resolve();
  }

  put(item: T) {
    this.data[item.id] = item;
    return Promise.resolve();
  }

  delete(id: string) {
    delete this.data[id];
    return Promise.resolve();
  }

  bulkGet(keys: string[]) {
    return Promise.resolve(keys.map(id => this.data[id]));
  }

  bulkAdd(items: T[]) {
    items.forEach(item => this.data[item.id] = item);
    return Promise.resolve();
  }

  where(key: string) {
    return {
      equals: (value: any) => ({
        toArray: () => Promise.resolve(
          Object.values(this.data).filter((item: any) => item[key] == value)
        )
      })
    }
  }
}

class MemoryDatabase {
  private _isOpen = false;

  local = new MemoryTable<any>();
  synced = new MemoryTable<any>();

  open() {
    this._isOpen = true;
  }

  close() {
    this._isOpen = false;
  }

  isOpen() {
    return this._isOpen;
  }
}
