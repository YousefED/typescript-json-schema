namespace A {
    export interface A { a: any; }
}
namespace B {
    export interface B { b: any; }
}
namespace C {
    import A = B.B;
    export interface C { c: A; }
}
namespace D {
    import A = C.C;
    export interface D { d: A; }
}

export interface MyObject extends D.D {}
