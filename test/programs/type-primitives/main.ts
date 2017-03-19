// Special type, should not appear in the schema
type integer = number

class MyObject {

    boolean1 = true

    number1 = 1

    /** @TJS-type integer */
    integer1 = 1
    integer2: integer = 1

    string1 = "defaultValue"

    array1: Array<any> = null
    array2: Array<number> = null

    object1: any = null
    object2: {} = null

}
