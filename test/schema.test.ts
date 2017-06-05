import {assert} from "chai";
import {CompilerOptions} from "typescript";
import * as TJS from "../typescript-json-schema";
import {readFileSync} from "fs";
import {resolve} from "path";
import * as Ajv from "ajv";

const ajv = new Ajv();

const metaSchema = require("ajv/lib/refs/json-schema-draft-04.json");
ajv.addMetaSchema(metaSchema, "http://json-schema.org/draft-04/schema#");

const BASE = "test/programs/";

export function assertSchema(group: string, name: string, type: string, settings: TJS.PartialArgs = {}, compilerOptions?: CompilerOptions) {
    it(group + " should create correct schema", () => {
        if (!("generateRequired" in settings)) {
            settings.generateRequired = true;
        }

        const actual = TJS.generateSchema(TJS.getProgramFromFiles([resolve(BASE + group + "/" + name)], compilerOptions), type, settings);

        const file = readFileSync(BASE + group + "/schema.json", "utf8");
        const expected = JSON.parse(file);

        assert.isObject(actual);
        assert.deepEqual(actual, expected, "The schema is not as expected");

        // test against the meta schema
        if (actual !== null) {
            ajv.validateSchema(actual);
            assert.equal(ajv.errors, null, "The schema is not valid");
        }
    });
}

describe("interfaces", () => {
    it("should return an instance of JsonSchemaGenerator", () => {
        const program = TJS.getProgramFromFiles([resolve(BASE + "comments/main.ts")]);
        const generator = TJS.buildGenerator(program);

        assert.instanceOf(generator, TJS.JsonSchemaGenerator);
        if (generator !== null) {
            assert.doesNotThrow(() => generator.getSchemaForSymbol("MyObject"));
            assert.doesNotThrow(() => generator.getSchemaForSymbol("Vector3D"));

            const symbols = generator.getUserSymbols();
            assert(symbols.indexOf("MyObject") > -1);
            assert(symbols.indexOf("Vector3D") > -1);
        }
    });
    it("should output the schemas set by setSchemaOverride", () => {
        const program = TJS.getProgramFromFiles([resolve(BASE + "interface-multi/main.ts")]);
        const generator = TJS.buildGenerator(program);
        assert(generator !== null);
        if (generator !== null) {
            const schemaOverride: TJS.Definition = { type: "string" };

            generator.setSchemaOverride("MySubObject", schemaOverride);
            const schema = generator.getSchemaForSymbol("MyObject");

            assert.deepEqual(schema.definitions!["MySubObject"], schemaOverride);
        }
    });
});

describe("schema", () => {
    assertSchema("array-and-description", "main.ts", "MyObject");
    assertSchema("class-single", "main.ts", "MyObject");
    assertSchema("class-extends", "main.ts", "MyObject");

    assertSchema("interface-single", "main.ts", "MyObject");
    assertSchema("interface-multi", "main.ts", "MyObject");
    assertSchema("interface-extends", "main.ts", "MyObject");

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
    assertSchema("enums-value-in-interface", "main.ts", "MyObject");
    assertSchema("string-literals", "main.ts", "MyObject");
    assertSchema("string-literals-inline", "main.ts", "MyObject");

    assertSchema("array-readonly", "main.ts", "MyReadOnlyArray");
    assertSchema("array-types", "main.ts", "MyArray");
    assertSchema("map-types", "main.ts", "MyObject");

    assertSchema("namespace", "main.ts", "Type");

    assertSchema("type-anonymous", "main.ts", "MyObject");
    assertSchema("type-primitives", "main.ts", "MyObject");
    assertSchema("type-nullable", "main.ts", "MyObject");

    assertSchema("optionals", "main.ts", "MyObject");

    assertSchema("comments", "main.ts", "MyObject");
    assertSchema("comments-override", "main.ts", "MyObject");

    assertSchema("force-type", "main.ts", "MyObject");
    assertSchema("force-type-imported", "main.ts", "MyObject");

    assertSchema("imports", "main.ts", "MyObject");

    assertSchema("extra-properties", "main.ts", "MyObject");

    assertSchema("generate-all-types", "main.ts", "*");

    /**
     * Type aliases
     */

    assertSchema("type-alias-single", "main.ts", "MyString");
    assertSchema("type-aliases", "main.ts", "MyObject", {
        useTypeAliasRef: true
    });
    assertSchema("type-aliases-fixed-size-array", "main.ts", "MyFixedSizeArray");
    assertSchema("type-aliases-multitype-array", "main.ts", "MyArray");
    assertSchema("type-aliases-local-namsepace", "main.ts", "MyObject", {
        useTypeAliasRef: true
    });

    assertSchema("type-aliases-alias-ref", "main.ts", "MyAlias", {
        useTypeAliasRef: true,
        useRootRef: false
    });
    // disabled beacuse of #80
    // assertSchema("type-aliases-alias-ref-topref", "main.ts", "MyAlias", {
    //     useTypeAliasRef: true,
    //     useRootRef: true
    // });
    assertSchema("type-aliases-recursive-object-topref", "main.ts", "MyObject", {
        useTypeAliasRef: true,
        useRootRef: true
    });
    // disabled beacuse of #80
    // assertSchema("type-aliases-recursive-alias-topref", "main.ts", "MyAlias", {
    //     useTypeAliasRef: true,
    //     useRootRef: true
    // });
    assertSchema("type-no-aliases-recursive-topref", "main.ts", "MyAlias", {
        useTypeAliasRef: false,
        useRootRef: true
    });

    /**
     *  unions and intersections
     */

    assertSchema("type-union", "main.ts", "MyObject");
    assertSchema("type-intersection", "main.ts", "MyObject", {
        disableExtraProperties: true
    });
    assertSchema("type-union-tagged", "main.ts", "Shape");
    assertSchema("type-aliases-union-namespace", "main.ts", "MyModel");

    assertSchema("strict-null-checks", "main.ts", "MyObject", undefined, {
        strictNullChecks: true
    });

    /**
     * annotations
     */

    assertSchema("annotation-default", "main.ts", "MyObject");

    assertSchema("typeof-keyword", "main.ts", "MyObject", {useTypeOfKeyword: true});

    const userValidationOpts = { validationKeywords: [ "chance", "important" ] };
    assertSchema("user-validation-keywords", "main.ts", "MyObject", userValidationOpts);
});
