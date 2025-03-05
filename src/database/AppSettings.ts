
import { EncryptedDatabase } from "./EncryptedDatabase"

type Keys = "lastUpdated"
    | "lastLoginUsername";

async function accessDatabase<T>(operation: (database: EncryptedDatabase) => Promise<T>) {
    const key = Uint8Array.from(process.env.APPSETTINGS_DBKEY?.split(",").map(value => parseInt(value)) || []);
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
