export interface IExcludeTest {
    AB: IExcludeTestAB;
    CD: IExcludeTestCD;
}

export interface IExcludeTestAB {
    A: string;
    B: string;
    /**
     * importantKey should be "A" | "B"
     */
    importantKey: Exclude<keyof IExcludeTestAB, "importantKey">;
}
export interface IExcludeTestCD {
    C: string;
    D: string;
    /**
     * importantKey should be "C" | "D"
     * but schema generator generates single Exclude type for the whole jsonschema document.
     * in the schema, here will be "A" | "B", which is not correct
     */
    importantKey: Exclude<keyof IExcludeTestCD, "importantKey">;
}
