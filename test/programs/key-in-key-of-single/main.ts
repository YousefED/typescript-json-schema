type Util = {
    utilKey: {
        utilDeepKey: string;
    };
};

export type Main = {
    [Key in keyof Util]: {
        [key: string]: Util[Key];
    };
};
