import { IdentifiableType, UUIDv4 } from "./identifiable";

 export type User = IdentifiableType & {
    contactId: UUIDv4;
    userSettingsId: UUIDv4;
 };

 export type UserSettings = IdentifiableType & {
    activeTeam?: UUIDv4;
    locale: string;
 };
