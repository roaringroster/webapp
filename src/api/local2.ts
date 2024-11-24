import { Ref, computed, ref } from "vue";
import Dexie from "dexie";
import argon2 from "argon2-browser";
import nacl from "tweetnacl";
import { ShareId } from "@localfirst/auth-provider-automerge-repo";
import { DocumentId } from "@automerge/automerge-repo";
import { createUser, createDevice, UserWithSecrets, DeviceWithSecrets, Base58 } from "@localfirst/auth";
import { UAParser } from "ua-parser-js";
import { bus } from "src/boot/eventBus";
import { EncryptedDatabase } from "src/database/EncryptedDatabase";
import Vault from "src/database/Vault";
import { didExpire } from "src/helper/expiration";
import { useQuasar } from "quasar";

const dbPrefix = "accountlocal.";

const db: Ref<EncryptedDatabase | null> = ref(null);
const isLoggedIn = computed(() => db.value?.isOpen() == true);
const currentAccount: Ref<LocalAccount | null> = ref(null);

// === username methods ===

async function allUsernames() {
    return (await Dexie.getDatabaseNames())
        .filter(name => name.startsWith(dbPrefix))
        .map(name => name.substring(dbPrefix.length))
}

async function getCaseSensitiveUsername(username: string) {
    return (await Dexie.getDatabaseNames())
        .find(name => name.toLowerCase() == (dbPrefix + username).toLowerCase())
        ?.substring(dbPrefix.length)
}

function isValidUsername(username: string) {
    // username needs to match POSIX fully portable filesnames, as it is used as database filename.
    // More characters than this minimum could be allowed in the future, but that would require tests on every operating system.
    return /^[A-Za-z0-9._-]{2,}$/.test(username);
}

async function exists(username: string) {
    return (await getCaseSensitiveUsername(username)) != undefined;
}

// === assertions ===

function assertLoggedIn() {
    if (!isLoggedIn.value) {
        logout();
        throw new Error("NotLoggedIn");
    }
}

function assertCanWriteData() {
    if (didExpire()) {
        throw new Error("AppIsReadOnly");
    }
}

async function assertValidLoginParams(username: string, password: string) {
    if (!username) {
        throw new Error("UsernameMissing")
    }

    if (!password) {
        throw new Error("PasswordMissing")
    }
}

async function assertValidRegistrationParams(username: string, password: string) {
    assertValidLoginParams(username, password);

    if (!isValidUsername(username)) {
        throw new Error("UsernameInvalid")
    }

    if (await exists(username)) {
        throw new Error("UsernameExists")
    }

    assertCanWriteData();
}

// === password encryption ===

async function hashPassword(password: string, salt?: string | Uint8Array) {
    // Algorithm parameters are oriented at the second recommended option with less memory
    // (source: https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-argon2-13#section-4)
    // with adjustment for even less memory because this is a mobile app.
    return await argon2.hash({
        pass: password,
        salt: salt || self.crypto.getRandomValues(new Uint8Array(16)), // 128-bit salt
        time: 3, // 3 iterations
        parallelism: 4, // 4 lanes
        mem: 4096, // 4 MiB, attention: value differs from the recommended 64 MiB (65536) to speed things up, as 64 MiB takes more than 5 seconds on a cheap tablet
        hashLen: 32, // 256-bit tag size
        type: argon2.ArgonType.Argon2id
    });
}

async function encryptLocalKey(username: string, password: string, key: Uint8Array) {
    const hashResult = await hashPassword(password);
    const salt = hashResult.encoded.split("$")[4];
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const message = nacl.secretbox(key, nonce, hashResult.hash);

    await Vault.set(username.toLowerCase(), { salt, nonce, message });
}

async function decryptLocalKey(username: string, password: string): Promise<Uint8Array> {
    const secret = await Vault.get(username.toLowerCase());

    if (!secret || !secret.salt || !secret.nonce || !secret.message) {
        throw new Error("EncryptionCorrupted")
    }

    const hashResult = await hashPassword(password, secret.salt);
    const key = nacl.secretbox.open(secret.message, secret.nonce, hashResult.hash);

    if (key === null) {
        throw new Error("WrongPassword");
    }

    return key;
}

// === account registration and deletion ===

async function registerAccount(username: string, password: string, locale = "", isDeviceOnly = false) {
  await assertValidRegistrationParams(username, password);

  return createLocalAccount(username, locale, isDeviceOnly);
}

async function persistAccountOnRegistration(account: LocalAccount, password: string) {
    const key = nacl.randomBytes(32);
    await encryptLocalKey(account.user.userName, password, key);

    await persistIfNeeded();

    const name = dbPrefix + account.user.userName;
    const db = new EncryptedDatabase(name, key);

    await db.open();
    await db.local.add({id: "account", value: account});
    db.close();
}

async function deleteAccount(username: string) {
    if (!username) {
        throw new Error("UsernameMissing")
    }

    const name = dbPrefix + await getCaseSensitiveUsername(username);

    if (!await Dexie.exists(name)) {
        throw new Error("UsernameDoesNotExist")
    }

    if (isLoggedIn.value && currentAccount.value) {
        if (username == currentAccount.value.user.userName) {
            await logout();
        }
    }

    await Dexie.delete(name);
    await Vault.delete(username.toLowerCase());
}

async function persistIfNeeded() {
    // see https://dexie.org/docs/StorageManager
    // also https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria
    // similar https://web.dev/persistent-storage/
    // Best Practices for Using IndexedDB: https://developers.google.com/web/fundamentals/instant-and-offline/web-storage/indexeddb-best-practices
    if (!(await navigator.storage?.persisted?.())) {
        return await navigator.storage?.persist?.() || false;
    } else {
        return true;
    }
}

// === login and logout ===

async function login(username: string, password: string) {
    assertValidLoginParams(username, password);

    const caseSensitiveUsername = await getCaseSensitiveUsername(username);
    const name = dbPrefix + caseSensitiveUsername;

    if (!caseSensitiveUsername || !await Dexie.exists(name)) {
        throw new Error("UsernameDoesNotExist")
    }

    const key = await decryptLocalKey(username, password);
    db.value = new EncryptedDatabase(name, key);
    await db.value.open();

    const account = await getAccount();
    await persistIfNeeded();

    if (!account) {
        await logout();
        throw new Error("UserDoesNotExist");
    }

    currentAccount.value = account;
    // await updateDeviceTypeIfNeeded(account);
    deleteExpiredInvitations();

    bus.emit("did-login");

    return account;
}

function logout() {
    if (db.value) {
        db.value.close();
        db.value = null;
        currentAccount.value = null;
        bus.emit("did-logout");
    }
}

// === read and update account ===

function getAccountRef() {
    return currentAccount;
}

async function getAccount() {
    assertLoggedIn();

    const item = await db.value?.local.get("account").catch(async () => {
        await logout();
        throw new Error("EncryptionCorrupted")
    });
    return item?.value as LocalAccount;
}

async function updateAccount(changes: ((value: LocalAccount) => void) | Partial<LocalAccount>, account?: LocalAccount) {
    assertCanWriteData();

    if (!account) {
        account = await getAccount();
    }

    let changeFn: (value: LocalAccount) => void;

    if (typeof changes != "function") {
        changeFn = value => Object.assign(value, changes);
    } else {
        changeFn = changes;
    }

    changeFn(account);
    await db.value?.local.put({id: "account", value: account});
    currentAccount.value = account;
}

async function updateDeviceSettings(settings: ((value: DeviceSettings) => void)) {
    await updateAccount((value: LocalAccount) => settings(value.settings));
}

// changes to device are not synced, it does not make sense to update device type only locally
// async function updateDeviceTypeIfNeeded(account: LocalAccount) {
//     const deviceType = getDeviceType();

//     if (account.device.deviceInfo?.deviceType != deviceType) {
//         await updateAccount(
//             account => account.device.deviceInfo.deviceType = deviceType, 
//             account
//         );
//     }
// }

// === change username and password ===

async function changeUsername(username: string, password: string) {
    assertValidLoginParams(username, password);
    assertLoggedIn();

    throw Error("NotImplemented");
}

async function changePassword(oldPassword: string, newPassword: string) {
    if (!oldPassword || !newPassword) {
        throw new Error("PasswordMissing")
    }

    const account = await getAccount();
    const username = account.user.userName;
    const caseSensitiveUsername = await getCaseSensitiveUsername(username);
    const dbName = dbPrefix + caseSensitiveUsername;
    const key = await decryptLocalKey(username, oldPassword);

    // ensure that user is really logged in by decrypting a value from the database
    const db = new EncryptedDatabase(dbName, key);
    await db.open();
    await db.local.get("account").catch(async () => {
        await logout();
        throw new Error("WrongPassword")
    });

    // change password
    await encryptLocalKey(username, newPassword, key);
}

// === account data type ===

export type LocalAccount = {
    user: UserWithSecrets;
    device: DeviceWithSecrets;
    settings: DeviceSettings;
    organizations: Organization[];
    activeOrganization?: ShareId;
    activeTeam?: DocumentId;
    currentPath: string;
}

export type PartialLocalAccount = Omit<LocalAccount, "user"> & {
    user?: UserWithSecrets;
}

type Organization = {
    shareId: ShareId;
    websocketServer: string;
};

type DeviceSettings = {
    locale: string;
    defaultWebsocketServer: string;
};

function getDeviceType() {
    const $q = useQuasar();
    const { device, os, browser } = UAParser(navigator.userAgent);

    const deviceInfo = [device.vendor, device.model].filter(Boolean);
    const deviceType = device.type;

    if (!$q.platform.is.electron && !$q.platform.is.cordova && !!browser.name) {
        deviceInfo.unshift(browser.name, "–");
    }

    if (!deviceInfo.length && !!deviceType) {
        deviceInfo.push(deviceType.charAt(0).toUpperCase() + deviceType.slice(1));
    }

    if (os.name) {
        if (deviceInfo.length) {
            let name = os.name;

            if (device.model?.toLowerCase() == "ipad" 
                && device.vendor?.toLocaleLowerCase() == "apple")
            {
                name = "iPadOS"
            }

            deviceInfo.push(`(${name})`)
        } else {
            deviceInfo.push(os.name)
        }
    }

    const deviceName = deviceInfo.join(" ");

    return { deviceName, deviceType };
}

function getDefaultWebsocketServer() {
    const server = process.env.SYNC_SERVER;

    if (!server) {
        throw Error("FatalAppError");
    }

    return server;
}

function createLocalAccount(username: string, locale = "", isDeviceOnly = false): PartialLocalAccount {
    const user: UserWithSecrets | undefined = !isDeviceOnly ? createUser(username) : undefined;
    const userId = user?.userId || username;
    const { deviceName, deviceType } = getDeviceType();
    const deviceInfo = { deviceType };
    const device = createDevice({ userId, deviceName, deviceInfo });
    // const device = createDevice(user?.userId || username, getDeviceName());
    const defaultWebsocketServer = getDefaultWebsocketServer();
    const settings: DeviceSettings = { locale, defaultWebsocketServer };
    const organizations: Organization[] = [];
    const currentPath = "";

    return {user, device, settings, organizations, currentPath};
}

// === read and update invitations ===

type InvitationSeed = {
    seed: string;
    expiration?: number;
};
export type InvitationSeeds = Record<Base58, InvitationSeed>;

function getInvitationsIdForOrganization() {
    const shareId = currentAccount.value?.activeOrganization;

    if (!shareId) {
        throw new Error("NoTeam");
    }

    return "invitations_" + shareId;
}

async function getInvitations() {
    assertLoggedIn();

    const id = getInvitationsIdForOrganization();
    const invitations = 
        ((await db.value?.local.get(id))?.value || {}) as InvitationSeeds;
    const now = Date.now();
    let didDeleteItems = false;

    // delete expired invitations first
    Object.entries(invitations).forEach(([id, invitation]) => {
        if (invitation.expiration != undefined && invitation.expiration < now) {
            delete invitations[id as Base58];
            didDeleteItems = true;
        }
    })

    // update invitations in database if some were deleted
    if (didDeleteItems) {
        await db.value?.local.put({id, value: invitations});
    }

    return invitations;
}

async function addInvitation(id: Base58, value: InvitationSeed) {
    assertLoggedIn();
    assertCanWriteData();

    const invitations = await getInvitations();
    invitations[id] = value;
    await db.value?.local.put({id: getInvitationsIdForOrganization(), value: invitations});

    return invitations;
}

async function deleteInvitation(id: Base58) {
    assertLoggedIn();

    const invitations = await getInvitations();

    if (invitations[id]) {
        delete invitations[id];
        await db.value?.local.put({id: getInvitationsIdForOrganization(), value: invitations});
    }

    return invitations;
}

async function deleteExpiredInvitations() {
    return await getInvitations();
}

// === hook ===

export function useAccount() {
    return { 
        allUsernames, 
        isLoggedIn, 
        loginAccount: login, 
        logoutAccount: logout, 
        registerAccount, 
        persistAccountOnRegistration, 
        deleteAccount,
        getAccountRef,
        updateAccount,
        updateDeviceSettings,
        changeUsername,
        changePassword,
        getInvitations,
        addInvitation,
        deleteInvitation
    }
}
