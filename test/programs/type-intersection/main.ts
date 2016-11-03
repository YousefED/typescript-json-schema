interface Type1 {
    value1: string;
}
interface Type2 {
    value2: number;
}

interface MyObject {
    value: Type1 & Type2;
}
