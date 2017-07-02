interface MyGeneric<A, B> {
    a: A;
    b: B;
}

export interface MyObject {
    value1: MyGeneric<string, number>;
    value2: MyGeneric<number, string>;
}
