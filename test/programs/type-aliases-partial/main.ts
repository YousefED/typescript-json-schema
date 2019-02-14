export interface Foo {
    x: number;
    y: number;
}

export interface Bar {
    a: number;
    b: number;
}

export interface MyObject {
    foo: Partial<Foo>;
    bar: Partial<Bar>;
}
