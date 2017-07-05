export interface MyGeneric<A, B> {
    field: MyGeneric<B, A>;
}

export interface MyObject {
    value: MyGeneric<string, number>;
}
