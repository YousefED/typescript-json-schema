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
  prop2: string;
}
