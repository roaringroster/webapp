import { v4 } from "uuid";

export type UUIDv4 = string;
export type Schema = number;

export type IdentifiableType = {
    readonly id: UUIDv4;
    schema: Schema;
}

export const createIdentifiable = () => ({
  id: v4(),
  schema: 1,
});
