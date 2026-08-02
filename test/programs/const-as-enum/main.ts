export enum Enum {
    X = 0,
    Y = 1,
}

export interface MyObject {
    reference: true;
    member: Enum.X;
}
