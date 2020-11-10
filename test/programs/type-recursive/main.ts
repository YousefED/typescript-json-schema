/**
 * A recursive type
 */
export type TestChildren = TestChild | Array<TestChild | TestChildren>;

interface TestChild {
    type: string;
}
