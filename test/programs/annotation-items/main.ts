interface MyObject {
  /**
   * @items {"type":"integer"}
   */
  a: number[];

  /**
   * @items {"type":"integer", "minimum":0}
   */
  b: number[];

  /**
   * @items.type integer
   * @items.minimum 0
   */
  c: number[];

  /**
   * @items.type integer
   */
  d: number[];

  /**
   * @items {"type":"string", "format":"email"}
   */
  emails: string[];

  /**
   * @items.type string
   * @items.format email
   */
  emails2: string[];

}
