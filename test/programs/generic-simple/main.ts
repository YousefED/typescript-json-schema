export interface MyGeneric<T> {
    field: T;
}

export interface MyObject {
    value: MyGeneric<number>;
}
