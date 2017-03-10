export interface MyObject {
  /**
   * Must be 'first' or 'last'
   *
   * @minLength 1
   * @chance {
   *   "pickone": [ [ "first", "last" ] ]
   * }
   * @ignoreThis 2
   * @important
   */
  name: string;
}
