interface Type1 {
    value1: string;
    value2: number;
}
interface Type2 {
    value2: number;
    value3: boolean;
}

// Type1 can be reused, make sure value2 still works.
interface MyObject {
    value1: Type1;
    value2: Type1 & Type2;
}
