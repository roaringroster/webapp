
import { EncryptedDatabase } from "./EncryptedDatabase"

type Keys = "lastUpdated"
    | "lastLoginUsername";

async function accessDatabase<T>(operation: (database: EncryptedDatabase) => Promise<T>) {
    const key = Uint8Array.from([117,92,224,103,245,209,145,178,128,123,202,194,188,164,94,181,168,87,48,227,202,184,246,191,156,141,232,100,188,212,15,224]);
    const db = new EncryptedDatabase("AppSettings", key);

    const result = await operation(db);
    db.close();

    return result;
}

export async function get<T>(key: Keys) {
    return accessDatabase(async db => 
        (await db.local.get(key))?.value as T
    );
}

export async function set<T>(key: Keys, value: T) {
    await accessDatabase(async db => 
        await db.local.put({
            id: key,
            value
        }, key)
    );
}

export async function remove(key: Keys) {
    await accessDatabase(async db => 
        await db.local.delete(key)
    );
}
