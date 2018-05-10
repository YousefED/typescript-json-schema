"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_json_schema_1 = require("./typescript-json-schema");
function run() {
    var helpText = "Usage: typescript-json-schema <path-to-typescript-files-or-tsconfig> <type>";
    var defaultArgs = typescript_json_schema_1.getDefaultArgs();
    var args = require("yargs")
        .usage(helpText)
        .demand(2)
        .boolean("refs").default("refs", defaultArgs.ref)
        .describe("refs", "Create shared ref definitions.")
        .boolean("aliasRefs").default("aliasRefs", defaultArgs.aliasRef)
        .describe("aliasRefs", "Create shared ref definitions for the type aliases.")
        .boolean("topRef").default("topRef", defaultArgs.topRef)
        .describe("topRef", "Create a top-level ref definition.")
        .boolean("titles").default("titles", defaultArgs.titles)
        .describe("titles", "Creates titles in the output schema.")
        .boolean("defaultProps").default("defaultProps", defaultArgs.defaultProps)
        .describe("defaultProps", "Create default properties definitions.")
        .boolean("noExtraProps").default("noExtraProps", defaultArgs.noExtraProps)
        .describe("noExtraProps", "Disable additional properties in objects by default.")
        .boolean("propOrder").default("propOrder", defaultArgs.propOrder)
        .describe("propOrder", "Create property order definitions.")
        .boolean("typeOfKeyword").default("typeOfKeyword", defaultArgs.typeOfKeyword)
        .describe("typeOfKeyword", "Use typeOf keyword (https://goo.gl/DC6sni) for functions.")
        .boolean("required").default("required", defaultArgs.required)
        .describe("required", "Create required array for non-optional properties.")
        .boolean("strictNullChecks").default("strictNullChecks", defaultArgs.strictNullChecks)
        .describe("strictNullChecks", "Make values non-nullable by default.")
        .boolean("ignoreErrors").default("ignoreErrors", defaultArgs.ignoreErrors)
        .describe("ignoreErrors", "Generate even if the program has errors.")
        .alias("out", "o")
        .describe("out", "The output file, defaults to using stdout")
        .array("validationKeywords").default("validationKeywords", defaultArgs.validationKeywords)
        .describe("validationKeywords", "Provide additional validation keywords to include.")
        .argv;
    typescript_json_schema_1.exec(args._[0], args._[1], {
        ref: args.refs,
        aliasRef: args.aliasRefs,
        topRef: args.topRef,
        titles: args.titles,
        defaultProps: args.defaultProps,
        noExtraProps: args.noExtraProps,
        propOrder: args.propOrder,
        typeOfKeyword: args.useTypeOfKeyword,
        required: args.required,
        strictNullChecks: args.strictNullChecks,
        ignoreErrors: args.ignoreErrors,
        out: args.out,
        validationKeywords: args.validationKeywords,
        excludePrivate: args.excludePrivate,
    });
}
exports.run = run;
if (typeof window === "undefined" && require.main === module) {
    run();
}
//# sourceMappingURL=typescript-json-schema-cli.js.map