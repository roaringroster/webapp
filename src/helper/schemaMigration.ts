import * as Auth from "@localfirst/auth";
import { cleanupAll, createDocument, getAuth, getOrganizationOrThrow, Handle, useOrganizationDocument } from "src/api/repo";
import { BaseType } from "src/models/base";
import { Organization } from "src/models/organization";
import { isDev } from "./appInfo";
import { delay } from "./utils";
import { createDeviceList } from "src/models/deviceList";

async function preload() {
  const start = Date.now();
  const auth = getAuth();
  const connectedPromise = new Promise<void>(resolve =>
    auth?.on("connected", () => resolve())
  );
  const orgHandle = useOrganizationDocument();
  await Promise.all([connectedPromise, orgHandle.handle.whenReady()]);
  console.log("connected after", (Date.now() - start) / 1000);
  orgHandle.handle.once("change", () => console.log("change after", (Date.now() - start) / 1000));
  await delay(0);
  console.log("preload finished after", (Date.now() - start) / 1000);
}

export async function migrateSchemas() {
  await preload();
  
  const authTeam = getOrganizationOrThrow();
  const orgHandle = useOrganizationDocument();
  await migrateOrganization(orgHandle, authTeam);
  
  cleanupAll([orgHandle]);
}

async function migrateOrganization(handle: Handle<Organization>, authTeam: Auth.Team) {
  const schema = await getSchema(handle);

  if (schema < 2) {
    handle.changeDoc(doc => {
      doc.deviceListId = createDocument(createDeviceList(), authTeam);
      doc.schema = 2;
    });
    log("Organization", 2, handle.docId);
  }

  return handle.doc.value!;
}

async function getSchema<T extends BaseType>(docHandle: Handle<T>) {
  await docHandle.handle.whenReady();
  return docHandle.doc.value!.schema;
}

 
function log(name: string, schema: number, docId: string) {
  if (isDev) {
    console.log(`migrated ${name} to schema v${schema} for document ${docId}`);
  }
}
