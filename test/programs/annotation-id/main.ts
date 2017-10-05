/**
 * @id filled#
 */
interface MySubObject {
    a: boolean;
}

interface MyObject {
    /**
     * @id empty#
     */
    empty;

    filled: MySubObject;
}
