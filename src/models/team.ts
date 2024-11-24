import { BaseType, createBase } from "./base";
import { User } from "./user";

type AuthUserId = string;

type TeamProps = {
  name: string;
  members: Record<AuthUserId, User>;
  admins: AuthUserId[];
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
  members = {},
  admins = [],
  // selectionOptions = {
  //   shiftRoles: [],
  // }
}: Partial<TeamProps> = {}): Team => ({
  ...createBase(),
  name,
  members,
  admins,
  // selectionOptions
});
