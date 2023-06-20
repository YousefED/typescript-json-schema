type Util = {
    __2Underscores: {
        utilDeepKey2: string;
    };
    ___3Underscores: {
        utilDeepKey3: string;
    };
    ____4Underscores: {
        utilDeepKey4: string;
    };
};

export type Main = {
    [Key in keyof Util]: {
        [key: string]: Util[Key];
    };
};
