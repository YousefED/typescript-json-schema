export type X = Y | Z;

export interface Y {
    myProp?: false;
}

export interface Z {
    myProp: true;
}
