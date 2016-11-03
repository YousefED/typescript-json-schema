enum Enum {
    A, // = 0
    B = 1,
    C = true as any,
    D = "str" as any,
    E = null
}

interface MyObject {
  foo: Enum;
}
