/**
 * Use this comment
 */
export type MyObject = Pick<BigThing, "prop1">;

interface BigThing {
  prop1: string;
  prop2: string;
};
