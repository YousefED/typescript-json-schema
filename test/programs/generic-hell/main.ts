export interface GenericA<A> {
    a: A;
}
export interface B {
    b: number;
}
export interface GenericC<C> {
    c: C;
}

export type SomeAlias<T> = SomeGeneric<T, T>;
export interface SomeGeneric<A, B> {
    a: A;
    b: B;
    c: GenericA<A>;
    d: GenericC<B>;
}

export interface MyObject extends GenericC<GenericC<GenericC<GenericA<string>>>>, B {
    someGeneric: SomeGeneric<1, 2>;
    someAlias: SomeAlias<"alias">;
}
