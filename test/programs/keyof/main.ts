type Util = {
    a: {
        b: string;
    };
};

export type Main = {
    [Key in keyof Util]: {
        [key: string]: Util[Key];
    };
};
