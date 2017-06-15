interface MyBase {
    baseRequired : number;
    baseOptional?: number;
}

interface MyDerived extends MyBase {
    derivedRequired : number;
    derivedOptional?: number;
}
