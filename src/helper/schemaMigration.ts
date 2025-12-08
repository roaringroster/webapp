import { cleanupAll, Handle, useOrganizationDocument } from "src/api/repo";
import { BaseType } from "src/models/base";
import { Organization } from "src/models/organization";
import { isDev } from "./appInfo";


export async function migrateSchemas() {
  const orgHandle = useOrganizationDocument();
  await migrateOrganization(orgHandle);
  
  cleanupAll([orgHandle]);
}

async function migrateOrganization(handle: Handle<Organization>) {
  await getSchema(handle);
  return handle.doc.value!;
}

async function getSchema<T extends BaseType>(docHandle: Handle<T>) {
  await docHandle.handle.whenReady();
  return docHandle.doc.value!.schema;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function log(name: string, schema: number, docId: string) {
  if (isDev) {
    console.log(`migrated ${name} to schema v${schema} for document ${docId}`);
  }
}
