interface MyObject {
  /**
   * @default true
   */
  varBoolean: boolean;
  /**
   * @default 123
   */
  varInteger: number;
  /**
   * @default 3.21
   */
  varFloat: number;
  /**
   * @default "foo"
   */
  varString: string;
  /**
   * @default [true, false, true]
   */
  varBooleanArray: boolean[];
  /**
   * @default [1, 2, 3, 4, 5]
   */
  varIntegerArray: number[];
  /**
   * @default [1.23, 65.21, -123.40, 0, 1000000.0001]
   */
  varFloatArray: number[];
  /**
   * @default ["a", "b", "c", "..."]
   */
  varStringArray: string[];
  /**
   * @default [true, 123, 3.21, "foo"]
   */
  varMixedArray: any[];
}
