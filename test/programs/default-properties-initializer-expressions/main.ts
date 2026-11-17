export class MyObject {
    varSeconds: number = 60 * 60 * 1000;
    varSum: number = 1 + 2;
    varDifference: number = 10 - 4;
    varDivision: number = 10 / 4;
    varRemainder: number = 10 % 4;
    varPower: number = 2 ** 10;
    varPrecedence: number = 2 + 3 * 4;
    varParenthesized: number = (2 + 3) * 4;
    varPositive: number = +5;
    varNegatedExpression: number = -(2 + 3);
    varConcat: string = "foo" + "bar";
    varObject: { count: number; window: number } = { count: 10, window: 5 };
    varNestedObject: { name: string; limits: number[] } = { name: "a", "limits": [1, 2 * 3] };
    // Infinity cannot be written to a JSON schema, so no default is set
    varDivideByZero: number = 1 / 0;
}
