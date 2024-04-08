import { Ref, computed, ref } from "vue";
import Dexie from "dexie";
import argon2 from "argon2-browser";
import nacl from "tweetnacl";
import { createUser, createDevice, UserWithSecrets, DeviceWithSecrets } from "@localfirst/auth";
import { UAParser } from "ua-parser-js";
import { bus } from "src/boot/eventBus";
import { EncryptedDatabase } from "src/database/EncryptedDatabase";
import Vault from "src/database/Vault";
import { didExpire } from "src/helper/expiration";

const dbPrefix = "accountlocal.";

const db: Ref<EncryptedDatabase | null> = ref(null);
const isLoggedIn = computed(() => db.value?.isOpen() == true);

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

async function registerAccount(username: string, password: string, locale = "") {
  await assertValidRegistrationParams(username, password);

  const account = createLocalAccount(username, locale);
  await persistAccountOnRegistration(account, password);
  return account;
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

    if (isLoggedIn.value) {
        const account = await getAccount();

        if (username == account.user.userName) {
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

    // bus.emit("did-login", account); // ToDo uncomment

    return account;
}

async function logout() {
    if (db.value) {
        db.value.close();
        db.value = null;
        bus.emit("did-logout");
    }
}

// === read and update account ===

async function getAccount() {
    assertLoggedIn();

    const item = await db.value?.local.get("account").catch(async () => {
        await logout();
        throw new Error("EncryptionCorrupted")
    });
    return item?.value as LocalAccount;
}

async function updateAccount(changes: ((value: LocalAccount) => void) | Partial<LocalAccount>) {
    assertCanWriteData();

    const account = await getAccount();

    if (typeof changes != "function") {
        changes = value => Object.assign(value, changes);
    }

    changes(account);

    await db.value?.local.put({id: "account", value: account});
}

async function getDeviceSettings() {
    return (await getAccount()).settings;
}

async function updateDeviceSettings(settings: ((value: DeviceSettings) => void) | DeviceSettings) {
    await updateAccount(
        typeof settings != "function"
            ? {settings}
            : (value: LocalAccount) => settings(value.settings)
    );
}

// === change username and password ===

async function changeUsername(username: string, password: string) {
    assertValidLoginParams(username, password);
    assertLoggedIn();
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
    activeTeam?: string;
}

type DeviceSettings = {
    locale: string;
    websocketServer: string;
};

function getDeviceName() {
    const { browser, os, device } = UAParser(navigator.userAgent)
    return `${device.model ?? os.name} (${browser.name})`
}

function getServerAddress() {
    const server = process.env.SYNC_SERVER;

    if (!server) {
        throw Error("FatalAppError");
    }

    return server;
}

function createLocalAccount(username: string, locale = ""): LocalAccount {
    const user = createUser(username);
    const device = createDevice(user.userId, getDeviceName());
    const websocketServer = getServerAddress();
    const settings = {locale, websocketServer};

    return {user, device, settings};
}

// === hook ===

export function useAccount() {
    return { 
        allUsernames, 
        isLoggedIn, 
        login, 
        logout, 
        registerAccount, 
        deleteAccount,
        getAccount,
        updateAccount,
        getDeviceSettings,
        updateDeviceSettings,
        changeUsername,
        changePassword
    }
}
