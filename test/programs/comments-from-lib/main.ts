/**
 * Use this comment
 */
export type MyObject = Pick<BigThing, "prop1">;

/**
 * Not this comment though
 */
interface BigThing {
  prop1: string;
  prop2: string;
};
