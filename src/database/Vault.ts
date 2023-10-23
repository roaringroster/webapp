import { EncryptedDatabase } from "./EncryptedDatabase";

declare global {
    interface CordovaPlugins {
        SecureKeyStore: SecureKeyStore;
    }
}

interface SecureKeyStore {
    get: (service: string, key: string) => Promise<string | undefined>;
    set: (service: string, key: string, password: string) => Promise<void>;
    remove: (service: string, key: string) => Promise<boolean>;
}

export type VaultSecretParameters = {
    salt: string;
    nonce: Uint8Array;
    message: Uint8Array;
};

export type VaultSecretResult = {
    salt?: Uint8Array;
    nonce?: Uint8Array;
    message?: Uint8Array;
} | undefined;


export default class Vault {
    private static service = (process.env.APP_ID || "app.roaringroster.any");
    private static vaultName = "vault";

    private static get electron() {
        return window.electronAPI?.vault;
    }

    private static get cordova(): SecureKeyStore | undefined {
        return window.cordova?.plugins?.SecureKeyStore;
    }

    private static get external(): SecureKeyStore | undefined {
        return this.electron || this.cordova;
    }

    static get type() {
        if (this.electron) {
            return "electron";
        } else if (this.cordova) {
            return "cordova";
        } else {
            return "indexeddb";
        }
    }

    private static uint8ArrayToString(array: Uint8Array) {
        return btoa(String.fromCharCode(...array));
    }

    private static stringToUint8Array(text: string) {
        return Uint8Array.from(Array.from(atob(text)).map(char => char.charCodeAt(0)))
    }

    private static parse(value: string | undefined | null) {
        if (value) {
            const [salt, nonce, message] = value.split("$").map(this.stringToUint8Array);
            return { salt, nonce, message } as VaultSecretResult;
        } else {
            return undefined;
        }
    }

    private static stringify(value: VaultSecretParameters) {
        return [
            value.salt,
            this.uint8ArrayToString(value.nonce),
            this.uint8ArrayToString(value.message)
        ].join("$");
    }

    private static async vaultExists() {
        return await EncryptedDatabase.exists(this.vaultName);
    }

    private static async run<T>(operation: (vault: EncryptedDatabase) => Promise<T>) {
        const key = Uint8Array.from([62,57,207,35,164,116,202,152,198,136,133,9,31,23,64,32,185,38,79,219,148,181,216,91,252,141,59,73,185,88,138,116]);
        const vault = new EncryptedDatabase(this.vaultName, key);

        const result = await operation(vault);
        vault.close();

        return result;
    }

    static async get(key: string) {
        return await this.vaultGet(key);
    }

    static async set(key: string, value: VaultSecretParameters) {
        await this.vaultSet(key, value);
    }

    static async delete(key: string) {
        await this.vaultDelete(key);
    }

    private static async vaultGet(key: string) {
        if (await this.vaultExists()) {
            return await this.run(async vault => {
                return this.parse((await vault.local.get(key))?.value as string | undefined);
            });
        }
    }

    private static async vaultSet(key: string, value: VaultSecretParameters) {
        await this.run(async vault => {
            await vault.local.put({
                id: key,
                value: this.stringify(value)
            }, key);
        });
    }

    private static async vaultDelete(key: string) {
        if (await this.vaultExists()) {
            await this.run(async vault => {
                await vault.local.delete(key);
            })
        }
    }
};
