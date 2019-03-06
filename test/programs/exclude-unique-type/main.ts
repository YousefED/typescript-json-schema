export interface IExcludeTest {
    AB: IExcludeTestAB;
    CD: IExcludeTestCD;
}

export interface IExcludeTestAB {
    A: string;
    B: string;
    importantKey: Exclude<keyof IExcludeTestAB, "importantKey">;
}
export interface IExcludeTestCD {
    C: string;
    D: string;
    importantKey: Exclude<keyof IExcludeTestCD, "importantKey">;
}
