/**
 * My string
 */
type MyString = string;

/**
 * My type alias
 */
type MyAlias = MySubObject;

/**
 * My sub object
 */
interface MySubObject {
    propA: number;
    propB: number;
}

/**
 * My Object
 */
interface MyObject {
    primitive: MyString;
    object: MySubObject;
    alias: MyAlias;
}
