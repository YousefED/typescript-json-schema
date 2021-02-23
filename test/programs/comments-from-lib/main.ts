/**
 * Want this comment, but doesn't work at the moment
 */
export type MyObject = Pick<BigThing, "prop1">;

/**
 * This comment should be ignored
 */
interface BigThing {
  prop1: string;
  prop2: string;
};
