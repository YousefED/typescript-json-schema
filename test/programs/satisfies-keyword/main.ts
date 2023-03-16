interface Basic {
    a: string;
    b: number;
    c: boolean;
}

const myObject = {
    a: "a" as const,
    b: 1 as const,
    c: true as const,
// tslint:disable-next-line:variable-name
} satisfies Basic;

export type Specific = typeof myObject;
