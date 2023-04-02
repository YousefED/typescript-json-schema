type Util = {
    utilKey1: {
        utilDeepKey11: string;
        utilDeepKey12: number;
    };
    utilKey2: {
        utilDeepKey21: boolean;
        utilDeepKey22: null;
    };
};

export type Main = {
    [Key in keyof Util]: {
        [key: string]: Util[Key];
    };
};
