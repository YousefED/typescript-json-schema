
type BasicArray = (string | number)[];

export interface MyObject {
    array: BasicArray;
}

export type MyUnion = (string | MyObject)[];
