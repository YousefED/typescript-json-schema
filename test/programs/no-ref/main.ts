type MySubType = {
    id: string;
};

export type MyModule = {
    address: MySubType & { extraProp: number };
    address2: MySubType;
    address3: MySubType;
};
