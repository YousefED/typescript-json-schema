import * as TJS from "../typescript-json-schema";
import * as Ajv from "ajv";
import { assert } from "chai";
import { readFileSync } from "fs";
import { resolve } from "path";
import { CompilerOptions } from "typescript";

const ajv = new Ajv();

const metaSchema = require("ajv/lib/refs/json-schema-draft-04.json");
ajv.addMetaSchema(metaSchema, "http://json-schema.org/draft-04/schema#");

const BASE = "test/programs/";

export function assertSchema(group: string, type: string, settings: TJS.PartialArgs = {}, compilerOptions?: CompilerOptions) {
    it(group + " should create correct schema", () => {
        if (!("generateRequired" in settings)) {
            settings.required = true;
        }

        const actual = TJS.generateSchema(TJS.getProgramFromFiles([resolve(BASE + group + "/main.ts")], compilerOptions), type, settings);

        // writeFileSync(BASE + group + "/schema.json", stringify(actual, {space: 4}) + "\n\n");

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

    describe("type aliases", () => {
        assertSchema("type-alias-single", "MyString");
        assertSchema("type-aliases", "MyObject", {
            aliasRef: true
        });
        assertSchema("type-aliases-fixed-size-array", "MyFixedSizeArray");
        assertSchema("type-aliases-multitype-array", "MyArray");
        assertSchema("type-aliases-local-namsepace", "MyObject", {
            aliasRef: true
        });

        assertSchema("type-aliases-alias-ref", "MyAlias", {
            aliasRef: true,
            topRef: false
        });
        // disabled beacuse of #80
        // assertSchema("type-aliases-alias-ref-topref", "MyAlias", {
        //     useTypeAliasRef: true,
        //     useRootRef: true
        // });
        assertSchema("type-aliases-recursive-object-topref", "MyObject", {
            aliasRef: true,
            topRef: true
        });
        // disabled beacuse of #80
        // assertSchema("type-aliases-recursive-alias-topref", "MyAlias", {
        //     useTypeAliasRef: true,
        //     useRootRef: true
        // });
        assertSchema("type-no-aliases-recursive-topref", "MyAlias", {
            aliasRef: false,
            topRef: true
        });

        /*
        assertSchema("type-aliases-primitive", "MyString");
        assertSchema("type-aliases-object", "MyAlias");
        assertSchema("type-aliases-mixed", "MyObject");
        assertSchema("type-aliases-union", "MyUnion");
        assertSchema("type-aliases-tuple", "MyTuple");
        assertSchema("type-aliases-anonymous", "MyObject");
        assertSchema("type-aliases-local-namespace", "MyObject");
        assertSchema("type-aliases-recursive-anonymous", "MyAlias");
        assertSchema("type-aliases-recursive-export", "MyObject");
        */
    });

    describe("enums", () => {
        assertSchema("enums-string", "MyObject");
        assertSchema("enums-number", "MyObject");
        assertSchema("enums-number-initialized", "Enum");
        assertSchema("enums-compiled-compute", "Enum");
        assertSchema("enums-mixed", "MyObject");
    });

    describe("unions and intersections", () => {
        assertSchema("type-union", "MyObject");
        assertSchema("type-intersection", "MyObject", {
            noExtraProps: true
        });
        assertSchema("type-union-tagged", "Shape");
        assertSchema("type-aliases-union-namespace", "MyModel");
    });

    describe("annotations", () => {
        assertSchema("annotation-default", "MyObject");

        assertSchema("typeof-keyword", "MyObject", {typeOfKeyword: true});

        assertSchema("user-validation-keywords", "MyObject", {
            validationKeywords: [ "chance", "important" ]
        });
    });

    describe("generics", () => {
        assertSchema("generic-simple", "MyObject");
        assertSchema("generic-arrays", "MyObject");
        assertSchema("generic-multiple", "MyObject");
        assertSchema("generic-multiargs", "MyObject");
        assertSchema("generic-anonymous", "MyObject");
        assertSchema("generic-recursive", "MyObject", {
            topRef: true
        });
        assertSchema("generic-hell", "MyObject");
    });

    describe("comments", () => {
        assertSchema("comments", "MyObject");
        assertSchema("comments-override", "MyObject");
    });

    describe("types", () => {
        assertSchema("force-type", "MyObject");
        assertSchema("force-type-imported", "MyObject");

        assertSchema("type-anonymous", "MyObject");
        assertSchema("type-primitives", "MyObject");
        assertSchema("type-nullable", "MyObject");
    });

    describe("class and interface", () => {
        assertSchema("class-single", "MyObject");
        assertSchema("class-extends", "MyObject");

        assertSchema("interface-single", "MyObject");
        assertSchema("interface-multi", "MyObject");
        assertSchema("interface-extends", "MyObject");

        assertSchema("interface-recursion", "MyObject", {
            topRef: true
        });

        assertSchema("module-interface-single", "MyObject");

        // not supported yet #116
        // assertSchema("interface-extra-props", "MyObject");

        // not supported right now
        // assertSchema("module-interface-deep", "Def");
    });

    describe("maps and arrays", () => {
        assertSchema("array-readonly", "MyReadOnlyArray");
        assertSchema("array-types", "MyArray");
        assertSchema("map-types", "MyObject");
    });

    describe("string literals", () => {
        assertSchema("string-literals", "MyObject");
        assertSchema("string-literals-inline", "MyObject");
    });

    describe("namspeaces", () => {
        assertSchema("namespace", "Type");
        assertSchema("namespace-deep-1", "RootNamespace.Def");
        assertSchema("namespace-deep-2", "RootNamespace.SubNamespace.HelperA");
    });

    describe("other", () => {
        assertSchema("array-and-description", "MyObject");

        assertSchema("optionals", "MyObject");

        assertSchema("strict-null-checks", "MyObject", undefined, {
            strictNullChecks: true
        });
    });
});
