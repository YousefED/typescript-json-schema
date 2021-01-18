interface MySubObject {
    bool: boolean;
    string: string;
    object: object | null;
    /**
     * @examples require('./examples.ts').mySubObject2Example
     */
    subObject?: MySubObject2;
}

export interface MySubObject2 {
    bool: boolean;
    string: string;
    object: object;
}

export interface MyDefaultObject {
  age: number;
  name: string;
  free?: boolean;
}

export interface MyObject {
    /**
     * @examples require(".").innerExample
     */
    filled: MySubObject;
    /**
     * @examples require('./examples.ts')
     */
    defaultObject: MyDefaultObject;
}

export const innerExample: MySubObject[] = [
    {
        bool: true,
        string: "string",
        object: {}
    },
];
