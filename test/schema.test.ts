import {assert} from "chai";
import {CompilerOptions} from "typescript";
import * as TJS from "../typescript-json-schema";
import {readFileSync} from "fs";
import {resolve} from "path";
import * as Ajv from "ajv";

const ajv = new Ajv();

const base = "test/programs/";

export function assertSchema(group: string, name: string, type: string, settings: any = {}, compilerOptions?: CompilerOptions) {
    it(group + " should create correct schema", function() {
        const defaults = TJS.getDefaultArgs();
        defaults.generateRequired = true;

        for (let pref in defaults) {
            if (!(pref in settings)) {
                settings[pref] = defaults[pref];
            }
        }

        const actual = TJS.generateSchema(TJS.getProgramFromFiles([resolve(base + group + "/" + name)], compilerOptions), type, settings);

        const file = readFileSync(base + group + "/schema.json", "utf8");
        const expected = JSON.parse(file);

        assert.isObject(actual);
        assert.deepEqual(actual, expected, "The schema is not as expected");

        // test against the meta schema
        ajv.validateSchema(actual);
        assert.equal(ajv.errors, null, "The schema is not valid");
    });
}

describe("schema", function () {
    assertSchema("array-and-description", "main.ts", "MyObject");
    assertSchema("class-single", "main.ts", "MyObject");

    assertSchema("interface-single", "main.ts", "MyObject");
    assertSchema("interface-multi", "main.ts", "MyObject");

    assertSchema("interface-recursion", "main.ts", "MyObject", {
        useRootRef: true
    });

    assertSchema("module-interface-single", "main.ts", "MyObject");

    // not supported right now
    // assertSchema("module-interface-deep", "main.ts", "Def");

    assertSchema("enums-string", "main.ts", "MyObject");
    assertSchema("enums-number", "main.ts", "MyObject");
    assertSchema("enums-number-initialized", "main.ts", "Enum");
    assertSchema("enums-compiled-compute", "main.ts", "Enum");
    assertSchema("enums-mixed", "main.ts", "MyObject");
    assertSchema("string-literals", "main.ts", "MyObject");
    assertSchema("string-literals-inline", "main.ts", "MyObject");

    assertSchema("array-types", "main.ts", "MyArray");
    assertSchema("map-types", "main.ts", "MyObject");

    assertSchema("namespace", "main.ts", "Type");

    assertSchema("type-union", "main.ts", "MyObject");
    assertSchema("type-intersection", "main.ts", "MyObject");

    assertSchema("type-alias-single", "main.ts", "MyString");
    assertSchema("type-aliases", "main.ts", "MyObject", {
        useTypeAliasRef: true
    });
    assertSchema("type-aliases-fixed-size-array", "main.ts", "MyFixedSizeArray");
    assertSchema("type-aliases-multitype-array", "main.ts", "MyArray");
    assertSchema("type-anonymous", "main.ts", "MyObject");
    assertSchema("type-primitives", "main.ts", "MyObject");
    assertSchema("type-nullable", "main.ts", "MyObject");

    assertSchema("optionals", "main.ts", "MyObject");

    assertSchema("comments", "main.ts", "MyObject");
    assertSchema("comments-override", "main.ts", "MyObject");

    assertSchema("type-union-tagged", "main.ts", "Shape");
    assertSchema("type-aliases-union-namespace", "main.ts", "MyModel");

    assertSchema("strict-null-checks", "main.ts", "MyObject", undefined, {
        strictNullChecks: true
    });
});
