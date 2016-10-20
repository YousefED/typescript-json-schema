/**
 * An integer greater than one
 * @type integer
 * @minimum 1
 */
export type PositiveInteger = number;

/**
 * Generic type or string
 */
export type OrString<T> = T | string;

/**
 * Testing nested generics
 */
export type Container<T> = { value: T };

export interface MyObject {
  /**
   * Property-level description
   * @additionalProperties false
   */
  user_id: PositiveInteger;
  user_ids: PositiveInteger[];
  /**
   * String or integer
   * @default n/a
   */
  identifier?: OrString<PositiveInteger>;
  something_else?: Container<OrString<PositiveInteger>>;
}
