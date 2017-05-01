interface Type1 {
    value1: string;
    value2: number;
}
interface Type2 {
    value2: number;
    value3: boolean;
}

interface MyObject {
    value: Type1 & Type2;
}
