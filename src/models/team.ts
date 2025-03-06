import { DocumentId } from "@automerge/automerge-repo";
import { AuthTeam, createDocument } from "src/api/repo";
import { BaseType, createBase } from "./base";
import { createRoster } from "./roster";

type AuthUserId = string;

type TeamProps = {
  name: string;
  members: AuthUserId[];
  admins: AuthUserId[];
  rosterId: DocumentId;
  // selectionOptions: {
  //   shiftRoles: {
  //     name: string;
  //     description: string;
  //     color: string;
  //   }[];
  // };
}

export type Team = BaseType & TeamProps;

export const createTeam = ({
    name = "",
    members = [],
    admins = [],
    // selectionOptions = {
    //   shiftRoles: [],
    // }
  }: Partial<TeamProps> = {},
  authTeam: AuthTeam
): Team => ({
  ...createBase(),
  name,
  members,
  admins,
  rosterId: createDocument(createRoster(), authTeam)
  // selectionOptions
});
