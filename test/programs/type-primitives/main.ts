/* tslint:disable:no-inferrable-types */

// Special type, should not appear in the schema
type integer = number;

class MyObject {

    boolean1: boolean     = true;

    number1: number       = 1;

    /** @TJS-type integer */
    integer1: number      = 1;
    integer2: integer     = 1;

    string1: string       = "defaultValue";

    array1: Array<any>    = null;
    array2: Array<number> = null;

    object1: any          = null;
    object2: {}           = null;

}
