
type BasicArray = (string | number)[];

interface MyObject {
    array: BasicArray;
}

type MyArray = (string | MyObject)[];
