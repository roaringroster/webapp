import argon2 from "argon2-browser";
import nacl from "tweetnacl";
import Dexie from "dexie";
import * as Automerge from "@automerge/automerge";
import { v4 } from "uuid";
import { toRaw } from "vue";
import { EncryptedDatabase } from "src/database/EncryptedDatabase";
import Vault from "src/database/Vault";
import { didExpire } from "src/helper/expiration";
import { User, UserSettings } from "src/models/user";
import { IdentifiableType, UUIDv4, createIdentifiable } from "src/models/identifiable";
import { Contact, createContact } from "src/models/contact";
import { bus } from "src/boot/eventBus";

export default class LocalAccountApi {
    private dbPrefix = "account.";
    private db?: EncryptedDatabase;
    private currentUser?: {
        user: Automerge.Doc<User>;
        userSettings: Automerge.Doc<UserSettings>;
        contact: Automerge.Doc<Contact>;
    };
    private actorId = v4().replace(/-/g, "");
    /** Transactions with async/await and promises do not work using Dexie with IndexedDBShim 
     * and it remains unclear to me why and how to resolve this as of 2023-10-09.
     * See https://github.com/dexie/Dexie.js/issues/712 and https://github.com/dexie/Dexie.js/issues/709.
     * Tested with Cordova on Android and it's native WebSQL implementation as well as the cordova-sqlite-storage plugin implementation.
     * An additional cause might be https://github.com/storesafe/cordova-sqlite-storage/issues/832. */
    private useTransaction = !window.shimIndexedDB;

    // === public auth methods ===
    
    get username() {
        return this.db?.name.substring(this.dbPrefix.length);
    }

    async allAccounts() {
        return (await Dexie.getDatabaseNames())
            .filter(name => name.startsWith(this.dbPrefix))
            .map(name => name.substring(this.dbPrefix.length))
    }

    async caseSensitiveUsername(username: string) {
        return (await Dexie.getDatabaseNames())
            .find(name => name.toLowerCase() == (this.dbPrefix + username).toLowerCase())
            ?.substring(this.dbPrefix.length)
    }

    isValidUserName(username: string) {
        // username needs to match POSIX fully portable filesnames, as it is used as database filename.
        // More characters than this minimum could be allowed in the future, but that would require tests on every operating system.
        return /^[A-Za-z0-9._-]{2,}$/.test(username);
    }

    async exists(username: string) {
        return (await this.caseSensitiveUsername(username)) != undefined;
    }

    // === private auth methods ===

    private async hashPassword(password: string, salt?: string | Uint8Array) {
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

    private async encryptLocalKey(username: string, password: string, key: Uint8Array) {
        const hashResult = await this.hashPassword(password);
        const salt = hashResult.encoded.split("$")[4];
        const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
        const message = nacl.secretbox(key, nonce, hashResult.hash);

        await Vault.set(username.toLowerCase(), { salt, nonce, message });
    }

    private async decryptLocalKey(username: string, password: string): Promise<Uint8Array> {
        const secret = await Vault.get(username.toLowerCase());

        if (!secret || !secret.salt || !secret.nonce || !secret.message) {
            throw new Error("EncryptionCorrupted")
        }

        const hashResult = await this.hashPassword(password, secret.salt);
        const key = nacl.secretbox.open(secret.message, secret.nonce, hashResult.hash);

        if (key === null) {
            throw new Error("WrongPassword");
        }

        return key;
    }

    private assertLoggedIn() {
        if (!this.isLoggedIn) {
            this.logout();
            throw new Error("NotLoggedIn");
        }
    }

    private assertCanWriteData() {
        if (didExpire()) {
            throw new Error("AppIsReadOnly");
        }
    }

    // === public methods for CRUD access to values in database "local" ===

    async getLocalValue<T>(key: string) {
        this.assertLoggedIn();

        return (await this.db?.local.get(key))?.value as T | undefined
    }

    async setLocalValue<T>(key: string, value: T) {
        this.assertLoggedIn();

        await this.db?.local.put({id: key, value})
    }

    async deleteLocalValue(key: string) {
        this.assertLoggedIn();

        await this.db?.local.delete(key);
    }

    // === auth methods ===

    get isLoggedIn() {
        return this.db?.isOpen() == true;
    }

    get userId() {
        return this.currentUser?.user.id;
    }

    get userEmail() {
        return undefined;
    }

    async login(username: string, password: string) {
        if (!username) {
            throw new Error("UsernameMissing");
        }
        if (!password) {
            throw new Error("PasswordMissing");
        }

        const caseSensitiveUsername = await this.caseSensitiveUsername(username);
        const name = this.dbPrefix + caseSensitiveUsername;

        if (!caseSensitiveUsername || !await Dexie.exists(name)) {
            throw new Error("UsernameDoesNotExist")
        }

        const key = await this.decryptLocalKey(username, password);
        const db = new EncryptedDatabase(name, key);
        await db.open();
        this.db = db;

        await db.local.get("verification").catch(async () => {
            await this.logout();
            throw new Error("EncryptionCorrupted")
        });
        await persistIfNeeded();
        
        const userData = await this.getCurrentUser().catch(async () => {
            await this.logout();
            throw new Error("UserDoesNotExist");
        });

        if (!userData) {
            await this.logout();
            throw new Error("UserDoesNotExist");
        }

        this.currentUser = userData;
        bus.emit("did-login", userData);
    }

    async logout() {
        if (this.db || this.currentUser) {
            this.db?.close();
            this.db = undefined;
            this.currentUser = undefined;
            bus.emit("did-logout");
        }
    }

    async registerUser(username: string, password: string, locale = "") {
        if (!username) {
            throw new Error("UsernameMissing")
        }

        if (!password) {
            throw new Error("PasswordMissing")
        }

        if (!this.isValidUserName(username)) {
            throw new Error("UsernameInvalid")
        }

        if (await this.exists(username)) {
            throw new Error("UsernameExists")
        }

        this.assertCanWriteData();

        const key = nacl.randomBytes(32);
        await this.encryptLocalKey(username, password, key);

        await persistIfNeeded();

        const name = this.dbPrefix + username;
        const db = new EncryptedDatabase(name, key);

        const userContact = createContact();
        const userSettings: UserSettings = {
            ...createIdentifiable(),
            locale,
        };
        const user: User = {
            ...createIdentifiable(),
            contactId: userContact.id,
            userSettingsId: userSettings.id,
        };

        await db.open();
        this.db = db;
        await this.createDocument(userContact);
        await this.createDocument(userSettings);
        await this.createDocument(user);
        await db.local.bulkAdd([{
            id: "verification",
            value: true
        },{
            id: "userId",
            value: user.id
        }]);
        db.close();
        this.db = undefined;
    }

    async changePassword(oldPassword: string, newPassword: string) {
        if (!oldPassword || !newPassword) {
            throw new Error("PasswordMissing")
        }

        if (!this.username || !await Dexie.exists(this.dbPrefix + this.username)) {
            throw new Error("UsernameDoesNotExist")
        }

        // ensure that user is really logged in by decrypting a value from the database
        await this.db?.local.get("verification").catch(async () => {
            await this.logout();
            throw new Error("WrongPassword");
        });

        const key = await this.decryptLocalKey(this.username, oldPassword);
        await this.encryptLocalKey(this.username, newPassword, key);
    }

    // === user methods ===

    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const value = await this.getLocalValue<string>("userId");

        if (!value) {
            return;
        }

        const user = await this.getDocumentById<User>(value);

        if (!user) {
            return;
        }

        const userSettings = await this.getDocumentById<UserSettings>(user.userSettingsId);
        const contact = await this.getDocumentById<Contact>(user.contactId);

        if (!userSettings || !contact) {
            return;
        }

        return { user, userSettings, contact };
    }

    async deleteLocalAccount(username: string) {
        if (!username) {
            throw new Error("UsernameMissing")
        }

        const name = this.dbPrefix + await this.caseSensitiveUsername(username);

        if (!await Dexie.exists(name)) {
            throw new Error("UsernameDoesNotExist")
        }

        if (username == this.username) {
            await this.logout();
        }

        await Dexie.delete(name);
        await Vault.delete(username.toLowerCase());
    }

    // === private methods for CRUD access and conversion of generic CRDT documents in database ===

    async getDocumentById<T extends IdentifiableType>(id: UUIDv4) {
        this.assertLoggedIn();

        const item = await this.db?.synced.get(id);

        if (!item) {
            return undefined;
        } else {
            return Automerge.load<T>(item.value, this.actorId);
        }
    }

    async getDocumentsById<T extends IdentifiableType>(idList: UUIDv4[]) {
        this.assertLoggedIn();

        const dataset = await this.db?.synced.bulkGet(idList) || [];
        return dataset.flatMap(data => 
            data != undefined
                ? [Automerge.load<T>(data.value, this.actorId)]
                : []
        );
    }

    async createDocument<T extends IdentifiableType>(value: T, overwrite = false) {
        this.assertLoggedIn();
        this.assertCanWriteData();

        let document = Automerge.from({}, this.actorId);
        const time = Math.floor(Date.now() / 1000);
        const message = JSON.stringify({ by: this.userId });
        document = Automerge.change(document, { time, message }, doc => Object.assign(doc, value));
        const item = {
            id: value.id,
            value: Automerge.save(document)
        };

        if (overwrite) {
            await this.db?.synced.put(item);
        } else {
            await this.db?.synced.add(item);
        }

        return document;
    }

    async updateDocument<T extends IdentifiableType>(doc: Automerge.Doc<T>, changeFn: Automerge.ChangeFn<T>) {
        this.assertLoggedIn();
        this.assertCanWriteData();

        doc = toRaw(doc);
        const { id } = doc;
        const time = Math.floor(Date.now() / 1000);
        const message = JSON.stringify({ by: this.userId });
        const localDoc = Automerge.change(doc, { time, message }, changeFn);

        return await this.transaction(async () => {
            const item = await this.db?.synced.get(id);

            if (item) {
                const remoteDoc = Automerge.load<T>(item.value, this.actorId);
                const mergedDoc = Automerge.merge(localDoc, remoteDoc);
                const value = Automerge.save(mergedDoc);
                const type = item.type;
                await this.db?.synced.put({ id, value, type });
                return mergedDoc;
            } else {
                throw new Error("ObjectDoesNotExist");
            }
        }) as Automerge.Doc<T>;
    }

    async updateDocumentWithChanges<T extends IdentifiableType>(doc: Automerge.Doc<T>, changes: Partial<T>) {
        return await this.updateDocument<T>(doc, doc => Object.assign(doc, changes));
    }

    async transaction<T>(transaction: () => T | Promise<T>) {
        if (this.useTransaction) {
            return await this.db?.transaction("rw", this.db.synced, transaction);
        } else {
            return await transaction();
        }
    }

}


export async function persistIfNeeded() {
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
