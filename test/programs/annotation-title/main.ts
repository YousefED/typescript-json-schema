/**
 * @title filled#
 */
interface MySubObject {
    a: boolean;
}

interface AnotherSubObject {
    b: boolean;
}

interface MyObject {
    /**
     * @title empty#
     */
    empty;
    /**
     * @title filled
     */
    filled: MySubObject;
    nonTitled: AnotherSubObject;
}
