import * as Ajv from "ajv";
import { assert } from "chai";
import { readFileSync } from "fs";
import { resolve } from "path";

import * as TJS from "../typescript-json-schema";

const ajv = new Ajv();

const BASE = "test/programs/";

export function assertSchema(group: string, type: string, settings: TJS.PartialArgs = {}, compilerOptions?: TJS.CompilerOptions, only?: boolean) {
    const run = only ? it.only : it;

    run(group + " should create correct schema", () => {
        if (!("required" in settings)) {
            settings.required = true;
        }

        const files = [resolve(BASE + group + "/main.ts")];
        const actual = TJS.generateSchema(TJS.getProgramFromFiles(files, compilerOptions), type, settings, files);

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

export function assertSchemas(group: string, type: string, settings: TJS.PartialArgs = {}, compilerOptions?: TJS.CompilerOptions) {
    it(group + " should create correct schema", () => {
        if (!("required" in settings)) {
            settings.required = true;
        }

        const generator = TJS.buildGenerator(TJS.getProgramFromFiles([resolve(BASE + group + "/main.ts")], compilerOptions), settings);
        const symbols = generator!.getSymbols(type);

        for (let symbol of symbols) {
          const actual = generator!.getSchemaForSymbol(symbol.name);

          // writeFileSync(BASE + group + `/schema.${symbol.name}.json`, JSON.stringify(actual, null, 4) + "\n\n");

          const file = readFileSync(BASE + group + `/schema.${symbol.name}.json`, "utf8");
          const expected = JSON.parse(file);

          assert.isObject(actual);
          assert.deepEqual(actual, expected, "The schema is not as expected");

          // test against the meta schema
          if (actual !== null) {
              ajv.validateSchema(actual);
              assert.equal(ajv.errors, null, "The schema is not valid");
          }
        }
    });
}

export function assertRejection(group: string, type: string, settings: TJS.PartialArgs = {}, compilerOptions?: TJS.CompilerOptions) {
    it(group + " should reject input", () => {
        let schema = null;
        assert.throws(() => {
            if (!("required" in settings)) {
                settings.required = true;
            }

            const files = [resolve(BASE + group + "/main.ts")];
            schema = TJS.generateSchema(TJS.getProgramFromFiles(files, compilerOptions), type, settings, files);
        });
        assert.equal(schema, null, "Expected no schema to be generated");
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
        assertSchema("type-alias-single-annotated", "MyString");
        assertSchema("type-aliases", "MyObject", {
            aliasRef: true
        });
        assertSchema("type-aliases-fixed-size-array", "MyFixedSizeArray");
        assertSchema("type-aliases-multitype-array", "MyArray");
        assertSchema("type-aliases-local-namsepace", "MyObject", {
            aliasRef: true,
            strictNullChecks: true,
        });
        assertSchema("type-aliases-partial", "MyObject", {
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

        assertSchema("type-mapped-types", "MyMappedType");

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
        assertSchema("type-aliases-tuple-of-variable-length", "MyTuple");
        assertSchema("type-aliases-tuple-with-rest-element", "MyTuple");
    });

    describe("enums", () => {
        assertSchema("enums-string", "MyObject");
        assertSchema("enums-number", "MyObject");
        assertSchema("enums-number-initialized", "Enum");
        assertSchema("enums-compiled-compute", "Enum");
        assertSchema("enums-mixed", "MyObject");
        assertSchema("enums-value-in-interface", "MyObject");
    });

    describe("unions and intersections", () => {
        assertSchema("type-union", "MyObject");
        assertSchema("type-intersection", "MyObject", {
            noExtraProps: true
        });
        assertSchema("type-union-tagged", "Shape");
        assertSchema("type-aliases-union-namespace", "MyModel");
        assertSchema("type-intersection-recursive", "*");
    });

    describe("annotations", () => {
        assertSchema("annotation-default", "MyObject");
        assertSchema("annotation-ref", "MyObject");
        assertSchema("annotation-tjs", "MyObject");
        assertSchema("annotation-id", "MyObject");

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
        assertSchema("comments-imports", "MyObject", {
            aliasRef: true
        });
    });

    describe("types", () => {
        assertSchema("force-type", "MyObject");
        assertSchema("force-type-imported", "MyObject");

        assertSchema("type-anonymous", "MyObject");
        assertSchema("type-primitives", "MyObject");
        assertSchema("type-nullable", "MyObject");
        // see https://github.com/epoberezkin/ajv/issues/725
        // assertSchema("type-function", "MyObject");
    });

    describe("class and interface", () => {
        assertSchema("class-single", "MyObject");
        assertSchema("class-extends", "MyObject");
        assertSchema("abstract-class", "AbstractBase");
        assertSchema("abstract-extends", "MyObjectFromAbstract");

        assertSchema("interface-single", "MyObject");
        assertSchema("interface-multi", "MyObject");
        assertSchema("interface-extends", "MyObject");

        assertSchema("interface-recursion", "MyObject", {
            topRef: true
        });

        assertSchema("module-interface-single", "MyObject");

        assertSchema("ignored-required", "MyObject");

        assertSchema("default-properties", "MyObject");

        // not supported yet #116
        // assertSchema("interface-extra-props", "MyObject");

        // not supported right now
        // assertSchema("module-interface-deep", "Def");
    });

    describe("maps and arrays", () => {
        assertSchema("array-readonly", "MyReadOnlyArray");
        assertSchema("array-types", "MyArray");
        assertSchema("map-types", "MyObject");
        assertSchema("extra-properties", "MyObject");
    });

    describe("string literals", () => {
        assertSchema("string-literals", "MyObject");
        assertSchema("string-literals-inline", "MyObject");
    });

    describe("custom dates", () => {
        assertSchema("custom-dates", "foo.Bar");
    });

    describe("dates", () => {
        assertSchema("dates", "MyObject");
        assertRejection("dates", "MyObject", {
            rejectDateType: true
        });
    });

    describe("namespaces", () => {
        assertSchema("namespace", "Type");
        assertSchema("namespace-deep-1", "RootNamespace.Def");
        assertSchema("namespace-deep-2", "RootNamespace.SubNamespace.HelperA");
    });

    describe("other", () => {
        assertSchema("array-and-description", "MyObject");

        assertSchema("optionals", "MyObject");
        assertSchema("optionals-derived", "MyDerived");

        assertSchema("strict-null-checks", "MyObject", undefined, {
            strictNullChecks: true
        });

        assertSchema("imports", "MyObject");

        assertSchema("generate-all-types", "*");

        assertSchema("private-members", "MyObject", {
            excludePrivate: true
        });

        assertSchemas("unique-names", "MyObject", {
            uniqueNames: true
        });

        assertSchema("builtin-names", "Ext.Foo");

        assertSchema("user-symbols", "*");

        assertSchemas("argument-id", "MyObject", {
            id: "someSchemaId"
        });
    });

    describe("object index", () => {
        assertSchema("object-numeric-index", "IndexInterface");
        assertSchema("object-numeric-index-as-property", "Target", { required: false });
    });
});

describe("tsconfig.json", () => {
    it("should read files from tsconfig.json", () => {
        const program = TJS.programFromConfig(resolve(BASE + "tsconfig/tsconfig.json"));
        const generator = TJS.buildGenerator(program);
        assert(generator !== null);
        assert.instanceOf(generator, TJS.JsonSchemaGenerator);
        if (generator !== null) {
            assert.doesNotThrow(() => generator.getSchemaForSymbol("IncludedAlways"));
            assert.doesNotThrow(() => generator.getSchemaForSymbol("IncludedOnlyByTsConfig"));
            assert.throws(() => generator.getSchemaForSymbol("Excluded"));
        }
    });
    it("should support includeOnlyFiles with tsconfig.json", () => {
        const program = TJS.programFromConfig(
            resolve(BASE + "tsconfig/tsconfig.json"), [resolve(BASE + "tsconfig/includedAlways.ts")]
        );
        const generator = TJS.buildGenerator(program);
        assert(generator !== null);
        assert.instanceOf(generator, TJS.JsonSchemaGenerator);
        if (generator !== null) {
            assert.doesNotThrow(() => generator.getSchemaForSymbol("IncludedAlways"));
            assert.throws(() => generator.getSchemaForSymbol("Excluded"));
            assert.throws(() => generator.getSchemaForSymbol("IncludedOnlyByTsConfig"));
        }
    });
});
