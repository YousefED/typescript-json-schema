import { assert } from "chai";
import { regexRequire } from "../typescript-json-schema";

const basicFilePath = "./file.ts";
const paths = [
    basicFilePath,
    ".",
    "@some-module",
    "@some-module/my_123",
    "/some/absolute/path-to-file",
    "../relative-path",
    "../../../relative-path/to-file.ts",
    "./relative-path/myFile123.js",
];

const objName = "objectName";
const extendedObjName = "$object12_Name";

const getValues = (singleQuotation: boolean) => {
    const quot = singleQuotation ? "'" : '"';
    return {
        path: `${quot}${basicFilePath}${quot}`,
        quot,
        quotName: singleQuotation ? "single" : "double",
    };
};

const matchSimple = (
    match: RegExpExecArray | null,
    singleQuotation: boolean,
    filePath: string,
    propertyName?: string
) => {
    assert.isArray(match);
    const quotation = singleQuotation ? "'" : '"';
    const expectedFileName = `${quotation}${filePath}${quotation}`;
    assert(match![2] === expectedFileName, `File doesn't match, got: ${match![2]}, expected: ${expectedFileName}`);
    assert(match![4] === propertyName, `Poperty has to be ${propertyName?.toString()}`);
};

const commonTests = (singleQuotation: boolean) => {
    const { quotName, path } = getValues(singleQuotation);
    it(`will not match, (${quotName} quotation mark)`, () => {
        assert.isNull(regexRequire(`pre require(${path})`));
        assert.isNull(regexRequire(`  e require(${path})`));
        assert.isNull(regexRequire(`require(${path})post`));
        assert.isNull(regexRequire(`requir(${path})`));
        assert.isNull(regexRequire(`require(${path}).e-r`));
        assert.isNull(regexRequire(`require(${path}`));
        assert.isNull(regexRequire(`require${path})`));
        assert.isNull(regexRequire(`require[${path}]`));
        assert.isNull(regexRequire(`REQUIRE[${path}]`));
    });
};

const tests = (singleQuotation: boolean, objectName?: string) => {
    const { quotName, path, quot } = getValues(singleQuotation);
    const objNamePath = objectName ? `.${objectName}` : "";
    it(`basic path (${quotName} quotation mark)`, () => {
        matchSimple(regexRequire(`require(${path})${objNamePath}`), singleQuotation, basicFilePath, objectName);
    });
    it(`white spaces and basic path (${quotName} quotation mark)`, () => {
        matchSimple(regexRequire(`   require(${path})${objNamePath}`), singleQuotation, basicFilePath, objectName);
        matchSimple(regexRequire(`require(${path})${objNamePath}    `), singleQuotation, basicFilePath, objectName);
        matchSimple(
            regexRequire(`      require(${path})${objNamePath}    `),
            singleQuotation,
            basicFilePath,
            objectName
        );
        matchSimple(
            regexRequire(`      require(${path})${objNamePath}    comment`),
            singleQuotation,
            basicFilePath,
            objectName
        );
        matchSimple(
            regexRequire(`      require(${path})${objNamePath}    comment   `),
            singleQuotation,
            basicFilePath,
            objectName
        );
    });
    it(`paths (${quotName} quotation mark)`, () => {
        paths.forEach((pathName) => {
            matchSimple(
                regexRequire(`require(${quot}${pathName}${quot})${objNamePath}`),
                singleQuotation,
                pathName,
                objectName
            );
        });
    });
};

describe("Double quotation", () => {
    tests(false);
    commonTests(false);
});

describe("Single quotation", () => {
    tests(true);
    commonTests(true);
});

describe("Double quotation + object", () => {
    tests(false, objName);
});

describe("Single quotation + object", () => {
    tests(true, objName);
});

describe("Double quotation + extended object name", () => {
    tests(false, extendedObjName);
});

describe("Single quotation + extended object name", () => {
    tests(true, extendedObjName);
});
