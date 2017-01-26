
/**
 * Type-level description
 * @additionalProperties true
 */
export interface MySubObject {
    value: string;
}

export interface MyObject {
    list: MySubObject[];

    sub1: MySubObject;

    /**
     * Property-level description
     * @additionalProperties false
     */
    sub2: MySubObject;
}
