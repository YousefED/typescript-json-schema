declare const https: unknown;

/**
 * This is MyOtherObject
 */
interface MyOtherObject {
  prop1: string;
}

/**
 * This is MyObject. It extends {@link MyOtherObject} and {@link SomeOtherObject}.
 */
interface MyObject extends MyOtherObject {
  /**
   * Like {@link MyOtherObject | the other object} and {@link SomeOtherObject | some other object}.
   */
  prop2: string;
  /**
   * Like {@link MyOtherObject.prop1 the first property} and {@linkcode MyOtherObject | its object}.
   */
  prop3: string;
  /**
   * See {@link https://example.com/docs | the docs} and {@link MyOtherObject.prop1 }.
   */
  prop4: string;
}
