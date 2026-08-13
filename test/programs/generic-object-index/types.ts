export type Simplify<T extends object> = {
    [K in keyof T]: T[K]
} & {}
export type Foo = { a: 1 }
