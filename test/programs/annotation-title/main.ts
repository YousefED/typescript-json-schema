/**
 * @title filled#
 */
interface MySubObject {
    a: boolean;
}

interface MyObject {
    /**
     * @title empty#
     */
    empty;

    filled: MySubObject;
}
