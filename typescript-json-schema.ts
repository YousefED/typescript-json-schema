import * as glob from "glob";
import * as stringify from "json-stable-stringify";
import * as path from "path";
import { createHash } from "crypto";
import * as ts from "typescript";
import { JSONSchema7 } from "json-schema";
export { Program, CompilerOptions, Symbol } from "typescript";

const vm = require("vm");

const REGEX_FILE_NAME_OR_SPACE = /(\bimport\(".*?"\)|".*?")\.| /g;
const REGEX_TSCONFIG_NAME = /^.*\.json$/;
const REGEX_TJS_JSDOC = /^-([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;
const REGEX_GROUP_JSDOC = /^[.]?([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;
/**
 * Resolve required file, his path and a property name,
 *      pattern: require([file_path]).[property_name]
 *
 * the part ".[property_name]" is optional in the regex
 *
 * will match:
 *
 *      require('./path.ts')
 *      require('./path.ts').objectName
 *      require("./path.ts")
 *      require("./path.ts").objectName
 *      require('@module-name')
 *
 *      match[2] = file_path (a path to the file with quotes)
 *      match[3] = (optional) property_name (a property name, exported in the file)
 *
 * for more details, see tests/require.test.ts
 */
const REGEX_REQUIRE = /^(\s+)?require\((\'@?[a-zA-Z0-9.\/_-]+\'|\"@?[a-zA-Z0-9.\/_-]+\")\)(\.([a-zA-Z0-9_$]+))?(\s+|$)/;
const NUMERIC_INDEX_PATTERN = "^[0-9]+$";

export function getDefaultArgs(): Args {
    return {
        ref: true,
        aliasRef: false,
        topRef: false,
        titles: false,
        defaultProps: false,
        noExtraProps: false,
        propOrder: false,
        typeOfKeyword: false,
        required: false,
        strictNullChecks: false,
        ignoreErrors: false,
        out: "",
        validationKeywords: [],
        include: [],
        excludePrivate: false,
        uniqueNames: false,
        rejectDateType: false,
        id: "",
        defaultNumberType: "number",
        tsNodeRegister: false,
    };
}

export type ValidationKeywords = {
    [prop: string]: boolean;
};

export type Args = {
    ref: boolean;
    aliasRef: boolean;
    topRef: boolean;
    titles: boolean;
    defaultProps: boolean;
    noExtraProps: boolean;
    propOrder: boolean;
    typeOfKeyword: boolean;
    required: boolean;
    strictNullChecks: boolean;
    ignoreErrors: boolean;
    out: string;
    validationKeywords: string[];
    include: string[];
    excludePrivate: boolean;
    uniqueNames: boolean;
    rejectDateType: boolean;
    id: string;
    defaultNumberType: "number" | "integer";
    tsNodeRegister: boolean;
};

export type PartialArgs = Partial<Args>;

export type PrimitiveType = number | boolean | string | null;

type RedefinedFields =
    | "type"
    | "items"
    | "additionalItems"
    | "contains"
    | "properties"
    | "patternProperties"
    | "additionalProperties"
    | "dependencies"
    | "propertyNames"
    | "if"
    | "then"
    | "else"
    | "allOf"
    | "anyOf"
    | "oneOf"
    | "not"
    | "definitions";
export type DefinitionOrBoolean = Definition | boolean;
export interface Definition extends Omit<JSONSchema7, RedefinedFields> {
    // The type field here is incompatible with the standard definition
    type?: string | string[];

    // Non-standard fields
    propertyOrder?: string[];
    defaultProperties?: string[];
    typeof?: "function";

    // Fields that must be redefined because they make use of this definition itself
    items?: DefinitionOrBoolean | DefinitionOrBoolean[];
    additionalItems?: DefinitionOrBoolean;
    contains?: JSONSchema7;
    properties?: {
        [key: string]: DefinitionOrBoolean;
    };
    patternProperties?: {
        [key: string]: DefinitionOrBoolean;
    };
    additionalProperties?: DefinitionOrBoolean;
    dependencies?: {
        [key: string]: DefinitionOrBoolean | string[];
    };
    propertyNames?: DefinitionOrBoolean;
    if?: DefinitionOrBoolean;
    then?: DefinitionOrBoolean;
    else?: DefinitionOrBoolean;
    allOf?: DefinitionOrBoolean[];
    anyOf?: DefinitionOrBoolean[];
    oneOf?: DefinitionOrBoolean[];
    not?: DefinitionOrBoolean;
    definitions?: {
        [key: string]: DefinitionOrBoolean;
    };
}

export type SymbolRef = {
    name: string;
    typeName: string;
    fullyQualifiedName: string;
    symbol: ts.Symbol;
};

function extend(target: any, ..._: any[]): any {
    if (target == null) {
        // TypeError if undefined or null
        throw new TypeError("Cannot convert undefined or null to object");
    }

    const to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];

        if (nextSource != null) {
            // Skip over if undefined or null
            for (const nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}

function unique(arr: string[]): string[] {
    const temp = {};
    for (const e of arr) {
        temp[e] = true;
    }
    const r: string[] = [];
    for (const k in temp) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(temp, k)) {
            r.push(k);
        }
    }
    return r;
}

/**
 * Resolve required file
 */
function resolveRequiredFile(symbol: ts.Symbol, key: string, fileName: string, objectName: string): any {
    const sourceFile = getSourceFile(symbol);
    const requiredFilePath = /^[.\/]+/.test(fileName)
        ? fileName === "."
            ? path.resolve(sourceFile.fileName)
            : path.resolve(path.dirname(sourceFile.fileName), fileName)
        : fileName;
    const requiredFile = require(requiredFilePath);
    if (!requiredFile) {
        throw Error("Required: File couldn't be loaded");
    }
    const requiredObject = objectName ? requiredFile[objectName] : requiredFile.default;
    if (requiredObject === undefined) {
        throw Error("Required: Variable is undefined");
    }
    if (typeof requiredObject === "function") {
        throw Error("Required: Can't use function as a variable");
    }
    if (key === "examples" && !Array.isArray(requiredObject)) {
        throw Error("Required: Variable isn't an array");
    }
    return requiredObject;
}

export function regexRequire(value: string) {
    return REGEX_REQUIRE.exec(value);
}

/**
 * Try to parse a value and returns the string if it fails.
 */
function parseValue(symbol: ts.Symbol, key: string, value: string): any {
    const match = regexRequire(value);
    if (match) {
        const fileName = match[2].substr(1, match[2].length - 2).trim();
        const objectName = match[4];
        return resolveRequiredFile(symbol, key, fileName, objectName);
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        return value;
    }
}

function extractLiteralValue(typ: ts.Type): PrimitiveType | undefined {
    let str = (<ts.LiteralType>typ).value;
    if (str === undefined) {
        str = (typ as any).text;
    }
    if (typ.flags & ts.TypeFlags.StringLiteral) {
        return str as string;
    } else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
        return (typ as any).intrinsicName === "true";
    } else if (typ.flags & ts.TypeFlags.EnumLiteral) {
        // or .text for old TS
        const num = parseFloat(str as string);
        return isNaN(num) ? (str as string) : num;
    } else if (typ.flags & ts.TypeFlags.NumberLiteral) {
        return parseFloat(str as string);
    }
    return undefined;
}

/**
 * Checks whether a type is a tuple type.
 */
function resolveTupleType(propertyType: ts.Type): ts.TupleTypeNode | null {
    if (
        !propertyType.getSymbol() &&
        propertyType.getFlags() & ts.TypeFlags.Object &&
        (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Reference
    ) {
        return (propertyType as ts.TypeReference).target as any;
    }
    if (
        !(
            propertyType.getFlags() & ts.TypeFlags.Object &&
            (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Tuple
        )
    ) {
        return null;
    }
    return propertyType as any;
}

const simpleTypesAllowedProperties = {
    type: true,
    description: true,
};

function addSimpleType(def: Definition, type: string): boolean {
    for (const k in def) {
        if (!simpleTypesAllowedProperties[k]) {
            return false;
        }
    }

    if (!def.type) {
        def.type = type;
    } else if (typeof def.type !== "string") {
        if (
            !(<Object[]>def.type).every((val) => {
                return typeof val === "string";
            })
        ) {
            return false;
        }

        if (def.type.indexOf("null") === -1) {
            def.type.push("null");
        }
    } else {
        if (typeof def.type !== "string") {
            return false;
        }

        if (def.type !== "null") {
            def.type = [def.type, "null"];
        }
    }
    return true;
}

function makeNullable(def: Definition): Definition {
    if (!addSimpleType(def, "null")) {
        const union = def.oneOf || def.anyOf;
        if (union) {
            union.push({ type: "null" });
        } else {
            const subdef = {};
            for (var k in def) {
                if (def.hasOwnProperty(k)) {
                    subdef[k] = def[k];
                    delete def[k];
                }
            }
            def.anyOf = [subdef, { type: "null" }];
        }
    }
    return def;
}

/**
 * Given a Symbol, returns a canonical Definition. That can be either:
 * 1) The Symbol's valueDeclaration parameter if defined, or
 * 2) The sole entry in the Symbol's declarations array, provided that array has a length of 1.
 *
 * valueDeclaration is listed as a required parameter in the definition of a Symbol, but I've
 * experienced crashes when it's undefined at runtime, which is the reason for this function's
 * existence. Not sure if that's a compiler API bug or what.
 */
function getCanonicalDeclaration(sym: ts.Symbol): ts.Declaration {
    if (sym.valueDeclaration !== undefined) {
        return sym.valueDeclaration;
    } else if (sym.declarations.length === 1) {
        return sym.declarations[0];
    }

    throw new Error(`Symbol "${sym.name}" has no valueDeclaration and ${sym.declarations.length} declarations.`);
}

/**
 * Given a Symbol, finds the place it was declared and chases parent pointers until we find a
 * node where SyntaxKind === SourceFile.
 */
function getSourceFile(sym: ts.Symbol): ts.SourceFile {
    let currentDecl: ts.Node = getCanonicalDeclaration(sym);

    while (currentDecl.kind !== ts.SyntaxKind.SourceFile) {
        if (currentDecl.parent === undefined) {
            throw new Error(`Unable to locate source file for declaration "${sym.name}".`);
        }
        currentDecl = currentDecl.parent;
    }

    return currentDecl as ts.SourceFile;
}

/**
 * JSDoc keywords that should be used to annotate the JSON schema.
 *
 * Many of these validation keywords are defined here: http://json-schema.org/latest/json-schema-validation.html
 */
// prettier-ignore
const validationKeywords = {
    multipleOf: true,               // 6.1.
    maximum: true,                  // 6.2.
    exclusiveMaximum: true,         // 6.3.
    minimum: true,                  // 6.4.
    exclusiveMinimum: true,         // 6.5.
    maxLength: true,                // 6.6.
    minLength: true,                // 6.7.
    pattern: true,                  // 6.8.
    items: true,                    // 6.9.
    // additionalItems: true,          // 6.10.
    maxItems: true,                 // 6.11.
    minItems: true,                 // 6.12.
    uniqueItems: true,              // 6.13.
    contains: true,                 // 6.14.
    maxProperties: true,            // 6.15.
    minProperties: true,            // 6.16.
    // required: true,                 // 6.17.  This is not required. It is auto-generated.
    // properties: true,               // 6.18.  This is not required. It is auto-generated.
    // patternProperties: true,        // 6.19.
    additionalProperties: true,     // 6.20.
    // dependencies: true,             // 6.21.
    // propertyNames: true,            // 6.22.
    enum: true,                     // 6.23.
    // const: true,                    // 6.24.
    type: true,                     // 6.25.
    // allOf: true,                    // 6.26.
    // anyOf: true,                    // 6.27.
    // oneOf: true,                    // 6.28.
    // not: true,                      // 6.29.
    examples: true,                    // Draft 6 (draft-handrews-json-schema-validation-01)

    ignore: true,
    description: true,
    format: true,
    default: true,
    $ref: true,
    id: true,
    title: true
};

/**
 * Subset of descriptive, non-type keywords that are permitted alongside a $ref.
 * Prior to JSON Schema draft 2019-09, $ref is a special keyword that doesn't
 * permit keywords alongside it, and so AJV may raise warnings if it encounters
 * any type-related keywords; see https://github.com/ajv-validator/ajv/issues/1121
 */
const annotationKeywords: { [k in keyof typeof validationKeywords]?: true } = {
    description: true,
    default: true,
    examples: true,
    // A JSDoc $ref annotation can appear as a $ref.
    $ref: true,
};

const subDefinitions = {
    items: true,
    additionalProperties: true,
    contains: true,
};

export class JsonSchemaGenerator {
    private tc: ts.TypeChecker;

    /**
     * Holds all symbols within a custom SymbolRef object, containing useful
     * information.
     */
    private symbols: SymbolRef[];
    /**
     * All types for declarations of classes, interfaces, enums, and type aliases
     * defined in all TS files.
     */
    private allSymbols: { [name: string]: ts.Type };
    /**
     * All symbols for declarations of classes, interfaces, enums, and type aliases
     * defined in non-default-lib TS files.
     */
    private userSymbols: { [name: string]: ts.Symbol };
    /**
     * Maps from the names of base types to the names of the types that inherit from
     * them.
     */
    private inheritingTypes: { [baseName: string]: string[] };

    /**
     * This map holds references to all reffed definitions, including schema
     * overrides and generated definitions.
     */
    private reffedDefinitions: { [key: string]: Definition } = {};

    /**
     * This map only holds explicit schema overrides. This helps differentiate between
     * user defined schema overrides and generated definitions.
     */
    private schemaOverrides = new Map<string, Definition>();

    /**
     * This is a set of all the user-defined validation keywords.
     */
    private userValidationKeywords: ValidationKeywords;

    /**
     * Types are assigned names which are looked up by their IDs.  This is the
     * map from type IDs to type names.
     */
    private typeNamesById: { [id: number]: string } = {};
    /**
     * Whenever a type is assigned its name, its entry in this dictionary is set,
     * so that we don't give the same name to two separate types.
     */
    private typeIdsByName: { [name: string]: number } = {};

    constructor(
        symbols: SymbolRef[],
        allSymbols: { [name: string]: ts.Type },
        userSymbols: { [name: string]: ts.Symbol },
        inheritingTypes: { [baseName: string]: string[] },
        tc: ts.TypeChecker,
        private args = getDefaultArgs()
    ) {
        this.symbols = symbols;
        this.allSymbols = allSymbols;
        this.userSymbols = userSymbols;
        this.inheritingTypes = inheritingTypes;
        this.tc = tc;
        this.userValidationKeywords = args.validationKeywords.reduce((acc, word) => ({ ...acc, [word]: true }), {});
    }

    public get ReffedDefinitions(): { [key: string]: Definition } {
        return this.reffedDefinitions;
    }

    /**
     * Parse the comments of a symbol into the definition and other annotations.
     */
    private parseCommentsIntoDefinition(symbol: ts.Symbol, definition: Definition, otherAnnotations: {}): void {
        if (!symbol) {
            return;
        }

        // the comments for a symbol
        const comments = symbol.getDocumentationComment(this.tc);

        if (comments.length) {
            definition.description = comments
                .map((comment) =>
                    comment.kind === "lineBreak" ? comment.text : comment.text.trim().replace(/\r\n/g, "\n")
                )
                .join("");
        }

        // jsdocs are separate from comments
        const jsdocs = symbol.getJsDocTags();
        jsdocs.forEach((doc) => {
            // if we have @TJS-... annotations, we have to parse them
            let [name, text] = [doc.name, doc.text as string];
            // In TypeScript versions prior to 3.7, it stops parsing the annotation
            // at the first non-alphanumeric character and puts the rest of the line as the
            // "text" of the annotation, so we have a little hack to check for the name
            // "TJS" and then we sort of re-parse the annotation to support prior versions
            // of TypeScript.
            if (name.startsWith("TJS-")) {
                name = name.slice(4);
                if (!text) {
                    text = "true";
                }
            } else if (name === "TJS" && text.startsWith("-")) {
                let match: string[] | RegExpExecArray | null = new RegExp(REGEX_TJS_JSDOC).exec(doc.text!);
                if (match) {
                    name = match[1];
                    text = match[2];
                } else {
                    // Treat empty text as boolean true
                    name = (text as string).replace(/^[\s\-]+/, "");
                    text = "true";
                }
            }

            // In TypeScript ~3.5, the annotation name splits at the dot character so we have
            // to process the "." and beyond from the value
            if (subDefinitions[name]) {
                const match: string[] | RegExpExecArray | null = new RegExp(REGEX_GROUP_JSDOC).exec(text);
                if (match) {
                    const k = match[1];
                    const v = match[2];
                    definition[name] = { ...definition[name], [k]: v ? parseValue(symbol, k, v) : true };
                    return;
                }
            }

            // In TypeScript 3.7+, the "." is kept as part of the annotation name
            if (name.includes(".")) {
                const parts = name.split(".");
                if (parts.length === 2 && subDefinitions[parts[0]]) {
                    definition[parts[0]] = {
                        ...definition[parts[0]],
                        [parts[1]]: text ? parseValue(symbol, name, text) : true,
                    };
                }
            }

            if (validationKeywords[name] || this.userValidationKeywords[name]) {
                definition[name] = text === undefined ? "" : parseValue(symbol, name, text);
            } else {
                // special annotations
                otherAnnotations[doc.name] = true;
            }
        });
    }

    private getDefinitionForRootType(
        propertyType: ts.Type,
        reffedType: ts.Symbol,
        definition: Definition,
        defaultNumberType = this.args.defaultNumberType
    ): Definition {
        const tupleType = resolveTupleType(propertyType);

        if (tupleType) {
            // tuple
            const elemTypes: ts.NodeArray<ts.TypeNode> = (propertyType as any).typeArguments;
            const fixedTypes = elemTypes.map((elType) => this.getTypeDefinition(elType as any));
            definition.type = "array";
            definition.items = fixedTypes;
            const targetTupleType = (propertyType as ts.TupleTypeReference).target;
            definition.minItems = targetTupleType.minLength;
            if (targetTupleType.hasRestElement) {
                definition.additionalItems = fixedTypes[fixedTypes.length - 1];
                fixedTypes.splice(fixedTypes.length - 1, 1);
            } else {
                definition.maxItems = targetTupleType.fixedLength;
            }
        } else {
            const propertyTypeString = this.tc.typeToString(
                propertyType,
                undefined,
                ts.TypeFormatFlags.UseFullyQualifiedType
            );
            const flags = propertyType.flags;
            const arrayType = this.tc.getIndexTypeOfType(propertyType, ts.IndexKind.Number);

            if (flags & ts.TypeFlags.String) {
                definition.type = "string";
            } else if (flags & ts.TypeFlags.Number) {
                const isInteger =
                    definition.type === "integer" ||
                    reffedType?.getName() === "integer" ||
                    defaultNumberType === "integer";
                definition.type = isInteger ? "integer" : "number";
            } else if (flags & ts.TypeFlags.Boolean) {
                definition.type = "boolean";
            } else if (flags & ts.TypeFlags.Null) {
                definition.type = "null";
            } else if (flags & ts.TypeFlags.Undefined) {
                definition.type = "undefined";
            } else if (flags & ts.TypeFlags.Any || flags & ts.TypeFlags.Unknown) {
                // no type restriction, so that anything will match
            } else if (propertyTypeString === "Date" && !this.args.rejectDateType) {
                definition.type = "string";
                definition.format = "date-time";
            } else if (propertyTypeString === "object") {
                definition.type = "object";
                definition.properties = {};
                definition.additionalProperties = true;
            } else {
                const value = extractLiteralValue(propertyType);
                if (value !== undefined) {
                    definition.type = typeof value;
                    definition.enum = [value];
                } else if (arrayType !== undefined) {
                    if (
                        propertyType.flags & ts.TypeFlags.Object &&
                        (propertyType as ts.ObjectType).objectFlags &
                            (ts.ObjectFlags.Anonymous | ts.ObjectFlags.Interface | ts.ObjectFlags.Mapped)
                    ) {
                        definition.type = "object";
                        definition.additionalProperties = false;
                        definition.patternProperties = {
                            [NUMERIC_INDEX_PATTERN]: this.getTypeDefinition(arrayType),
                        };
                    } else {
                        definition.type = "array";
                        if (!definition.items) {
                            definition.items = this.getTypeDefinition(arrayType);
                        }
                    }
                } else {
                    // Report that type could not be processed
                    const error = new TypeError("Unsupported type: " + propertyTypeString);
                    (error as any).type = propertyType;
                    throw error;
                    // definition = this.getTypeDefinition(propertyType, tc);
                }
            }
        }

        return definition;
    }

    private getReferencedTypeSymbol(prop: ts.Symbol): ts.Symbol | undefined {
        const decl = prop.getDeclarations();
        if (decl?.length) {
            const type = <ts.TypeReferenceNode>(<any>decl[0]).type;
            if (type && type.kind & ts.SyntaxKind.TypeReference && type.typeName) {
                const symbol = this.tc.getSymbolAtLocation(type.typeName);
                if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
                    return this.tc.getAliasedSymbol(symbol);
                }
                return symbol;
            }
        }
        return undefined;
    }

    private getDefinitionForProperty(prop: ts.Symbol, node: ts.Node): Definition | null {
        if (prop.flags & ts.SymbolFlags.Method) {
            return null;
        }
        const propertyName = prop.getName();
        const propertyType = this.tc.getTypeOfSymbolAtLocation(prop, node);

        const reffedType = this.getReferencedTypeSymbol(prop);

        const definition = this.getTypeDefinition(propertyType, undefined, undefined, prop, reffedType);

        if (this.args.titles) {
            definition.title = propertyName;
        }

        if (definition.hasOwnProperty("ignore")) {
            return null;
        }

        // try to get default value
        const valDecl = prop.valueDeclaration as ts.VariableDeclaration;
        if (valDecl?.initializer) {
            let initial = valDecl.initializer;

            while (ts.isTypeAssertion(initial)) {
                initial = initial.expression;
            }

            if ((<any>initial).expression) {
                // node
                console.warn("initializer is expression for property " + propertyName);
            } else if ((<any>initial).kind && (<any>initial).kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                definition.default = initial.getText();
            } else {
                try {
                    const sandbox = { sandboxvar: null as any };
                    vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);

                    const val = sandbox.sandboxvar;
                    if (
                        val === null ||
                        typeof val === "string" ||
                        typeof val === "number" ||
                        typeof val === "boolean" ||
                        Object.prototype.toString.call(val) === "[object Array]"
                    ) {
                        definition.default = val;
                    } else if (val) {
                        console.warn("unknown initializer for property " + propertyName + ": " + val);
                    }
                } catch (e) {
                    console.warn("exception evaluating initializer for property " + propertyName);
                }
            }
        }

        return definition;
    }

    private getEnumDefinition(clazzType: ts.Type, definition: Definition): Definition {
        const node = clazzType.getSymbol()!.getDeclarations()![0];
        const fullName = this.tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        const members: ts.NodeArray<ts.EnumMember> =
            node.kind === ts.SyntaxKind.EnumDeclaration
                ? (node as ts.EnumDeclaration).members
                : ts.createNodeArray([node as ts.EnumMember]);
        var enumValues: (number | boolean | string | null)[] = [];
        const enumTypes: string[] = [];

        const addType = (type: string) => {
            if (enumTypes.indexOf(type) === -1) {
                enumTypes.push(type);
            }
        };

        members.forEach((member) => {
            const caseLabel = (<ts.Identifier>member.name).text;
            const constantValue = this.tc.getConstantValue(member);
            if (constantValue !== undefined) {
                enumValues.push(constantValue);
                addType(typeof constantValue);
            } else {
                // try to extract the enums value; it will probably by a cast expression
                const initial: ts.Expression | undefined = member.initializer;
                if (initial) {
                    if ((<any>initial).expression) {
                        // node
                        const exp = (<any>initial).expression;
                        const text = (<any>exp).text;
                        // if it is an expression with a text literal, chances are it is the enum convention:
                        // CASELABEL = 'literal' as any
                        if (text) {
                            enumValues.push(text);
                            addType("string");
                        } else if (exp.kind === ts.SyntaxKind.TrueKeyword || exp.kind === ts.SyntaxKind.FalseKeyword) {
                            enumValues.push(exp.kind === ts.SyntaxKind.TrueKeyword);
                            addType("boolean");
                        } else {
                            console.warn("initializer is expression for enum: " + fullName + "." + caseLabel);
                        }
                    } else if (initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText());
                        addType("string");
                    } else if (initial.kind === ts.SyntaxKind.NullKeyword) {
                        enumValues.push(null);
                        addType("null");
                    }
                }
            }
        });

        if (enumTypes.length) {
            definition.type = enumTypes.length === 1 ? enumTypes[0] : enumTypes;
        }

        if (enumValues.length > 0) {
            definition.enum = enumValues.sort();
        }

        return definition;
    }

    private getUnionDefinition(
        unionType: ts.UnionType,
        prop: ts.Symbol,
        unionModifier: string,
        definition: Definition
    ): Definition {
        const enumValues: PrimitiveType[] = [];
        const simpleTypes: string[] = [];
        const schemas: Definition[] = [];

        const pushSimpleType = (type: string) => {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };

        const pushEnumValue = (val: PrimitiveType) => {
            if (enumValues.indexOf(val) === -1) {
                enumValues.push(val);
            }
        };

        for (const valueType of unionType.types) {
            const value = extractLiteralValue(valueType);
            if (value !== undefined) {
                pushEnumValue(value);
            } else {
                const def = this.getTypeDefinition(valueType);
                if (def.type === "undefined") {
                    if (prop) {
                        (<any>prop).mayBeUndefined = true;
                    }
                } else {
                    const keys = Object.keys(def);
                    if (keys.length === 1 && keys[0] === "type") {
                        if (typeof def.type !== "string") {
                            console.error("Expected only a simple type.");
                        } else {
                            pushSimpleType(def.type);
                        }
                    } else {
                        schemas.push(def);
                    }
                }
            }
        }

        if (enumValues.length > 0) {
            // If the values are true and false, just add "boolean" as simple type
            const isOnlyBooleans =
                enumValues.length === 2 &&
                typeof enumValues[0] === "boolean" &&
                typeof enumValues[1] === "boolean" &&
                enumValues[0] !== enumValues[1];

            if (isOnlyBooleans) {
                pushSimpleType("boolean");
            } else {
                const enumSchema: Definition = { enum: enumValues.sort() };

                // If all values are of the same primitive type, add a "type" field to the schema
                if (
                    enumValues.every((x) => {
                        return typeof x === "string";
                    })
                ) {
                    enumSchema.type = "string";
                } else if (
                    enumValues.every((x) => {
                        return typeof x === "number";
                    })
                ) {
                    enumSchema.type = "number";
                } else if (
                    enumValues.every((x) => {
                        return typeof x === "boolean";
                    })
                ) {
                    enumSchema.type = "boolean";
                }

                schemas.push(enumSchema);
            }
        }

        if (simpleTypes.length > 0) {
            schemas.push({ type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes });
        }

        if (schemas.length === 1) {
            for (const k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k];
                }
            }
        } else {
            definition[unionModifier] = schemas;
        }
        return definition;
    }

    private getIntersectionDefinition(intersectionType: ts.IntersectionType, definition: Definition): Definition {
        const simpleTypes: string[] = [];
        const schemas: Definition[] = [];

        const pushSimpleType = (type: string) => {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };

        for (const intersectionMember of intersectionType.types) {
            const def = this.getTypeDefinition(intersectionMember);
            if (def.type === "undefined") {
                console.error("Undefined in intersection makes no sense.");
            } else {
                const keys = Object.keys(def);
                if (keys.length === 1 && keys[0] === "type") {
                    if (typeof def.type !== "string") {
                        console.error("Expected only a simple type.");
                    } else {
                        pushSimpleType(def.type);
                    }
                } else {
                    schemas.push(def);
                }
            }
        }

        if (simpleTypes.length > 0) {
            schemas.push({ type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes });
        }

        if (schemas.length === 1) {
            for (const k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k];
                }
            }
        } else {
            definition.allOf = schemas;
        }
        return definition;
    }

    private getClassDefinition(clazzType: ts.Type, definition: Definition): Definition {
        const node = clazzType.getSymbol()!.getDeclarations()![0];

        // Example: typeof globalThis may not have any declaration
        if (!node) {
            definition.type = "object";
            return definition;
        }

        if (this.args.typeOfKeyword && node.kind === ts.SyntaxKind.FunctionType) {
            definition.typeof = "function";
            return definition;
        }

        const clazz = <ts.ClassDeclaration>node;
        const props = this.tc.getPropertiesOfType(clazzType).filter((prop) => {
            // filter never
            const propertyType = this.tc.getTypeOfSymbolAtLocation(prop, node);
            if (ts.TypeFlags.Never === propertyType.getFlags()) {
                return false;
            }
            if (!this.args.excludePrivate) {
                return true;
            }

            const decls = prop.declarations;
            return !(
                decls?.filter((decl) => {
                    const mods = decl.modifiers;
                    return mods && mods.filter((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword).length > 0;
                }).length > 0
            );
        });
        const fullName = this.tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

        const modifierFlags = ts.getCombinedModifierFlags(node);

        if (modifierFlags & ts.ModifierFlags.Abstract && this.inheritingTypes[fullName]) {
            const oneOf = this.inheritingTypes[fullName].map((typename) => {
                return this.getTypeDefinition(this.allSymbols[typename]);
            });

            definition.oneOf = oneOf;
        } else {
            if (clazz.members) {
                const indexSignatures =
                    clazz.members == null ? [] : clazz.members.filter((x) => x.kind === ts.SyntaxKind.IndexSignature);
                if (indexSignatures.length === 1) {
                    // for case "array-types"
                    const indexSignature = indexSignatures[0] as ts.IndexSignatureDeclaration;
                    if (indexSignature.parameters.length !== 1) {
                        throw new Error("Not supported: IndexSignatureDeclaration parameters.length != 1");
                    }
                    const indexSymbol: ts.Symbol = (<any>indexSignature.parameters[0]).symbol;
                    const indexType = this.tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                    const isStringIndexed = indexType.flags === ts.TypeFlags.String;
                    if (indexType.flags !== ts.TypeFlags.Number && !isStringIndexed) {
                        throw new Error(
                            "Not supported: IndexSignatureDeclaration with index symbol other than a number or a string"
                        );
                    }

                    const typ = this.tc.getTypeAtLocation(indexSignature.type!);
                    const def = this.getTypeDefinition(typ, undefined, "anyOf");

                    if (isStringIndexed) {
                        definition.type = "object";
                        definition.additionalProperties = def;
                    } else {
                        definition.type = "array";
                        if (!definition.items) {
                            definition.items = def;
                        }
                    }
                }
            }

            const propertyDefinitions = props.reduce((all, prop) => {
                const propertyName = prop.getName();
                const propDef = this.getDefinitionForProperty(prop, node);
                if (propDef != null) {
                    all[propertyName] = propDef;
                }
                return all;
            }, {});

            if (definition.type === undefined) {
                definition.type = "object";
            }

            if (definition.type === "object" && Object.keys(propertyDefinitions).length > 0) {
                definition.properties = propertyDefinitions;
            }

            if (this.args.defaultProps) {
                definition.defaultProperties = [];
            }
            if (this.args.noExtraProps && definition.additionalProperties === undefined) {
                definition.additionalProperties = false;
            }
            if (this.args.propOrder) {
                // propertyOrder is non-standard, but useful:
                // https://github.com/json-schema/json-schema/issues/87
                const propertyOrder = props.reduce((order: string[], prop: ts.Symbol) => {
                    order.push(prop.getName());
                    return order;
                }, []);

                definition.propertyOrder = propertyOrder;
            }
            if (this.args.required) {
                const requiredProps = props.reduce((required: string[], prop: ts.Symbol) => {
                    const def = {};
                    this.parseCommentsIntoDefinition(prop, def, {});
                    if (
                        !(prop.flags & ts.SymbolFlags.Optional) &&
                        !(prop.flags & ts.SymbolFlags.Method) &&
                        !(<any>prop).mayBeUndefined &&
                        !def.hasOwnProperty("ignore")
                    ) {
                        required.push(prop.getName());
                    }
                    return required;
                }, []);

                if (requiredProps.length > 0) {
                    definition.required = unique(requiredProps).sort();
                }
            }
        }
        return definition;
    }

    /**
     * Gets/generates a globally unique type name for the given type
     */
    private getTypeName(typ: ts.Type): string {
        const id = (typ as any).id as number;
        if (this.typeNamesById[id]) {
            // Name already assigned?
            return this.typeNamesById[id];
        }
        return this.makeTypeNameUnique(
            typ,
            this.tc
                .typeToString(
                    typ,
                    undefined,
                    ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseFullyQualifiedType
                )
                .replace(REGEX_FILE_NAME_OR_SPACE, "")
        );
    }

    private makeTypeNameUnique(typ: ts.Type, baseName: string): string {
        const id = (typ as any).id as number;

        let name = baseName;
        // If a type with same name exists
        // Try appending "_1", "_2", etc.
        for (let i = 1; this.typeIdsByName[name] !== undefined && this.typeIdsByName[name] !== id; ++i) {
            name = baseName + "_" + i;
        }

        this.typeNamesById[id] = name;
        this.typeIdsByName[name] = id;
        return name;
    }

    private recursiveTypeRef = new Map();

    private getTypeDefinition(
        typ: ts.Type,
        asRef = this.args.ref,
        unionModifier: string = "anyOf",
        prop?: ts.Symbol,
        reffedType?: ts.Symbol,
        pairedSymbol?: ts.Symbol
    ): Definition {
        const definition: Definition = {}; // real definition

        // Ignore any number of Readonly and Mutable type wrappings, since they only add and remove readonly modifiers on fields and JSON Schema is not concerned with mutability
        while (
            typ.aliasSymbol &&
            (typ.aliasSymbol.escapedName === "Readonly" || typ.aliasSymbol.escapedName === "Mutable") &&
            typ.aliasTypeArguments &&
            typ.aliasTypeArguments[0]
        ) {
            typ = typ.aliasTypeArguments[0];
            reffedType = undefined;
        }

        if (
            this.args.typeOfKeyword &&
            typ.flags & ts.TypeFlags.Object &&
            (<ts.ObjectType>typ).objectFlags & ts.ObjectFlags.Anonymous
        ) {
            definition.typeof = "function";
            return definition;
        }

        let returnedDefinition = definition; // returned definition, may be a $ref

        // Parse property comments now to skip recursive if ignore.
        if (prop) {
            const defs = {};
            const others = {};
            this.parseCommentsIntoDefinition(prop, defs, others);
            if (defs.hasOwnProperty("ignore")) {
                return defs;
            }
        }

        const symbol = typ.getSymbol();
        // FIXME: We can't just compare the name of the symbol - it ignores the namespace
        const isRawType =
            !symbol ||
            // Window is incorrectly marked as rawType here for some reason
            (this.tc.getFullyQualifiedName(symbol) !== "Window" &&
                (this.tc.getFullyQualifiedName(symbol) === "Date" ||
                    symbol.name === "integer" ||
                    this.tc.getIndexInfoOfType(typ, ts.IndexKind.Number) !== undefined));

        // special case: an union where all child are string literals -> make an enum instead
        let isStringEnum = false;
        if (typ.flags & ts.TypeFlags.Union) {
            const unionType = <ts.UnionType>typ;
            isStringEnum = unionType.types.every((propType) => {
                return (propType.getFlags() & ts.TypeFlags.StringLiteral) !== 0;
            });
        }

        // aliased types must be handled slightly different
        const asTypeAliasRef = asRef && reffedType && (this.args.aliasRef || isStringEnum);
        if (!asTypeAliasRef) {
            if (
                isRawType ||
                (typ.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>typ).objectFlags & ts.ObjectFlags.Anonymous)
            ) {
                asRef = false; // raw types and inline types cannot be reffed,
                // unless we are handling a type alias
                // or it is recursive type - see below
            }
        }

        let fullTypeName = "";
        if (asTypeAliasRef) {
            const typeName = this.tc
                .getFullyQualifiedName(
                    reffedType!.getFlags() & ts.SymbolFlags.Alias ? this.tc.getAliasedSymbol(reffedType!) : reffedType!
                )
                .replace(REGEX_FILE_NAME_OR_SPACE, "");
            if (this.args.uniqueNames && reffedType) {
                const sourceFile = getSourceFile(reffedType);
                const relativePath = path.relative(process.cwd(), sourceFile.fileName);
                fullTypeName = `${typeName}.${generateHashOfNode(getCanonicalDeclaration(reffedType!), relativePath)}`;
            } else {
                fullTypeName = this.makeTypeNameUnique(typ, typeName);
            }
        } else {
            // typ.symbol can be undefined
            if (this.args.uniqueNames && typ.symbol) {
                const sym = typ.symbol;
                const sourceFile = getSourceFile(sym);
                const relativePath = path.relative(process.cwd(), sourceFile.fileName);
                fullTypeName = `${this.getTypeName(typ)}.${generateHashOfNode(
                    getCanonicalDeclaration(sym),
                    relativePath
                )}`;
            } else if (reffedType && this.schemaOverrides.has(reffedType.escapedName as string)) {
                fullTypeName = reffedType.escapedName as string;
            } else {
                fullTypeName = this.getTypeName(typ);
            }
        }

        // Handle recursive types
        if (!isRawType || !!typ.aliasSymbol) {
            if (this.recursiveTypeRef.has(fullTypeName)) {
                asRef = true;
            } else {
                this.recursiveTypeRef.set(fullTypeName, definition);
            }
        }

        if (asRef) {
            // We don't return the full definition, but we put it into
            // reffedDefinitions below.
            returnedDefinition = {
                $ref: `${this.args.id}#/definitions/` + fullTypeName,
            };
        }

        // Parse comments
        const otherAnnotations = {};
        this.parseCommentsIntoDefinition(reffedType!, definition, otherAnnotations); // handle comments in the type alias declaration
        this.parseCommentsIntoDefinition(symbol!, definition, otherAnnotations);
        this.parseCommentsIntoDefinition(typ.aliasSymbol!, definition, otherAnnotations);
        if (prop) {
            this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations);
        }
        // Create the actual definition only if is an inline definition, or
        // if it will be a $ref and it is not yet created
        if (!asRef || !this.reffedDefinitions[fullTypeName]) {
            if (asRef) {
                // must be here to prevent recursivity problems
                let reffedDefinition: Definition;
                if (asTypeAliasRef && reffedType && typ.symbol !== reffedType && symbol) {
                    reffedDefinition = this.getTypeDefinition(typ, true, undefined, symbol, symbol);
                } else {
                    reffedDefinition = definition;
                }
                this.reffedDefinitions[fullTypeName] = reffedDefinition;
                if (this.args.titles && fullTypeName) {
                    definition.title = fullTypeName;
                }
            }
            const node = symbol?.getDeclarations() !== undefined ? symbol.getDeclarations()![0] : null;

            if (definition.type === undefined) {
                // if users override the type, do not try to infer it
                if (typ.flags & ts.TypeFlags.Union) {
                    this.getUnionDefinition(typ as ts.UnionType, prop!, unionModifier, definition);
                } else if (typ.flags & ts.TypeFlags.Intersection) {
                    if (this.args.noExtraProps) {
                        // extend object instead of using allOf because allOf does not work well with additional properties. See #107
                        if (this.args.noExtraProps) {
                            definition.additionalProperties = false;
                        }

                        const types = (<ts.IntersectionType>typ).types;
                        for (const member of types) {
                            const other = this.getTypeDefinition(member, false);
                            definition.type = other.type; // should always be object
                            definition.properties = {
                                ...definition.properties,
                                ...other.properties,
                            };
                            if (Object.keys(other.default || {}).length > 0) {
                                definition.default = extend(definition.default || {}, other.default);
                            }
                            if (other.required) {
                                definition.required = unique((definition.required || []).concat(other.required)).sort();
                            }
                        }
                    } else {
                        this.getIntersectionDefinition(typ as ts.IntersectionType, definition);
                    }
                } else if (isRawType) {
                    if (pairedSymbol) {
                        this.parseCommentsIntoDefinition(pairedSymbol, definition, {});
                    }
                    this.getDefinitionForRootType(typ, reffedType!, definition);
                } else if (
                    node &&
                    (node.kind === ts.SyntaxKind.EnumDeclaration || node.kind === ts.SyntaxKind.EnumMember)
                ) {
                    this.getEnumDefinition(typ, definition);
                } else if (
                    symbol &&
                    symbol.flags & ts.SymbolFlags.TypeLiteral &&
                    symbol.members!.size === 0 &&
                    !(node && node.kind === ts.SyntaxKind.MappedType)
                ) {
                    // {} is TypeLiteral with no members. Need special case because it doesn't have declarations.
                    definition.type = "object";
                    definition.properties = {};
                } else {
                    this.getClassDefinition(typ, definition);
                }
            }
        }

        if (this.recursiveTypeRef.get(fullTypeName) === definition) {
            this.recursiveTypeRef.delete(fullTypeName);
            // If the type was recursive (there is reffedDefinitions) - lets replace it to reference
            if (this.reffedDefinitions[fullTypeName]) {
                const annotations = Object.entries(returnedDefinition).reduce((acc, [key, value]) => {
                    if (annotationKeywords[key] && typeof value !== undefined) {
                        acc[key] = value;
                    }
                    return acc;
                }, {});

                returnedDefinition = {
                    $ref: `${this.args.id}#/definitions/` + fullTypeName,
                    ...annotations,
                };
            }
        }

        if (otherAnnotations["nullable"]) {
            makeNullable(returnedDefinition);
        }

        return returnedDefinition;
    }

    public setSchemaOverride(symbolName: string, schema: Definition): void {
        this.reffedDefinitions[symbolName] = schema;
        this.schemaOverrides.set(symbolName, schema);
    }

    public getSchemaForSymbol(symbolName: string, includeReffedDefinitions: boolean = true): Definition {
        if (!this.allSymbols[symbolName]) {
            throw new Error(`type ${symbolName} not found`);
        }
        const def = this.getTypeDefinition(
            this.allSymbols[symbolName],
            this.args.topRef,
            undefined,
            undefined,
            undefined,
            this.userSymbols[symbolName] || undefined
        );

        if (this.args.ref && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            def.definitions = this.reffedDefinitions;
        }
        def["$schema"] = "http://json-schema.org/draft-07/schema#";
        const id = this.args.id;
        if (id) {
            def["$id"] = this.args.id;
        }
        return def;
    }

    public getSchemaForSymbols(symbolNames: string[], includeReffedDefinitions: boolean = true): Definition {
        const root = {
            $schema: "http://json-schema.org/draft-07/schema#",
            definitions: {},
        };
        const id = this.args.id;

        if (id) {
            root["$id"] = id;
        }

        for (const symbolName of symbolNames) {
            root.definitions[symbolName] = this.getTypeDefinition(
                this.allSymbols[symbolName],
                this.args.topRef,
                undefined,
                undefined,
                undefined,
                this.userSymbols[symbolName]
            );
        }
        if (this.args.ref && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            root.definitions = { ...root.definitions, ...this.reffedDefinitions };
        }
        return root;
    }

    public getSymbols(name?: string): SymbolRef[] {
        if (name === void 0) {
            return this.symbols;
        }

        return this.symbols.filter((symbol) => symbol.typeName === name);
    }

    public getUserSymbols(): string[] {
        return Object.keys(this.userSymbols);
    }

    public getMainFileSymbols(program: ts.Program, onlyIncludeFiles?: string[]): string[] {
        function includeFile(file: ts.SourceFile): boolean {
            if (onlyIncludeFiles === undefined) {
                return !file.isDeclarationFile;
            }
            return onlyIncludeFiles.indexOf(file.fileName) >= 0;
        }
        const files = program.getSourceFiles().filter(includeFile);
        if (files.length) {
            return Object.keys(this.userSymbols).filter((key) => {
                const symbol = this.userSymbols[key];
                if (!symbol || !symbol.declarations || !symbol.declarations.length) {
                    return false;
                }
                let node: ts.Node = symbol.declarations[0];
                while (node?.parent) {
                    node = node.parent;
                }
                return files.indexOf(node.getSourceFile()) > -1;
            });
        }
        return [];
    }
}

export function getProgramFromFiles(
    files: string[],
    jsonCompilerOptions: any = {},
    basePath: string = "./"
): ts.Program {
    // use built-in default options
    const compilerOptions = ts.convertCompilerOptionsFromJson(jsonCompilerOptions, basePath).options;
    const options: ts.CompilerOptions = {
        noEmit: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        allowUnusedLabels: true,
    };
    for (const k in compilerOptions) {
        if (compilerOptions.hasOwnProperty(k)) {
            options[k] = compilerOptions[k];
        }
    }
    return ts.createProgram(files, options);
}

function generateHashOfNode(node: ts.Node, relativePath: string): string {
    return createHash("md5").update(relativePath).update(node.pos.toString()).digest("hex").substring(0, 8);
}

export function buildGenerator(
    program: ts.Program,
    args: PartialArgs = {},
    onlyIncludeFiles?: string[]
): JsonSchemaGenerator | null {
    function isUserFile(file: ts.SourceFile): boolean {
        if (onlyIncludeFiles === undefined) {
            return !file.hasNoDefaultLib;
        }
        return onlyIncludeFiles.indexOf(file.fileName) >= 0;
    }
    // Use defaults unless otherwise specified
    const settings = getDefaultArgs();

    for (const pref in args) {
        if (args.hasOwnProperty(pref)) {
            settings[pref] = args[pref];
        }
    }

    if (args.tsNodeRegister) {
        require("ts-node/register");
    }

    let diagnostics: ReadonlyArray<ts.Diagnostic> = [];

    if (!args.ignoreErrors) {
        diagnostics = ts.getPreEmitDiagnostics(program);
    }

    if (diagnostics.length === 0) {
        const typeChecker = program.getTypeChecker();

        const symbols: SymbolRef[] = [];
        const allSymbols: { [name: string]: ts.Type } = {};
        const userSymbols: { [name: string]: ts.Symbol } = {};
        const inheritingTypes: { [baseName: string]: string[] } = {};
        const workingDir = program.getCurrentDirectory();

        program.getSourceFiles().forEach((sourceFile, _sourceFileIdx) => {
            const relativePath = path.relative(workingDir, sourceFile.fileName);

            function inspect(node: ts.Node, tc: ts.TypeChecker) {
                if (
                    node.kind === ts.SyntaxKind.ClassDeclaration ||
                    node.kind === ts.SyntaxKind.InterfaceDeclaration ||
                    node.kind === ts.SyntaxKind.EnumDeclaration ||
                    node.kind === ts.SyntaxKind.TypeAliasDeclaration
                ) {
                    const symbol: ts.Symbol = (<any>node).symbol;
                    const nodeType = tc.getTypeAtLocation(node);
                    const fullyQualifiedName = tc.getFullyQualifiedName(symbol);
                    const typeName = fullyQualifiedName.replace(/".*"\./, "");
                    const name = !args.uniqueNames ? typeName : `${typeName}.${generateHashOfNode(node, relativePath)}`;

                    symbols.push({ name, typeName, fullyQualifiedName, symbol });
                    if (!userSymbols[name]) {
                        allSymbols[name] = nodeType;
                    }

                    if (isUserFile(sourceFile)) {
                        userSymbols[name] = symbol;
                    }

                    const baseTypes = nodeType.getBaseTypes() || [];

                    baseTypes.forEach((baseType) => {
                        var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        if (!inheritingTypes[baseName]) {
                            inheritingTypes[baseName] = [];
                        }
                        inheritingTypes[baseName].push(name);
                    });
                } else {
                    ts.forEachChild(node, (n) => inspect(n, tc));
                }
            }
            inspect(sourceFile, typeChecker);
        });

        return new JsonSchemaGenerator(symbols, allSymbols, userSymbols, inheritingTypes, typeChecker, settings);
    } else {
        diagnostics.forEach((diagnostic) => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.error(message);
            }
        });
        return null;
    }
}

export function generateSchema(
    program: ts.Program,
    fullTypeName: string,
    args: PartialArgs = {},
    onlyIncludeFiles?: string[]
): Definition | null {
    const generator = buildGenerator(program, args, onlyIncludeFiles);

    if (generator === null) {
        return null;
    }

    if (fullTypeName === "*") {
        // All types in file(s)
        return generator.getSchemaForSymbols(generator.getMainFileSymbols(program, onlyIncludeFiles));
    } else if (args.uniqueNames) {
        // Find the hashed type name to use as the root object
        const matchingSymbols = generator.getSymbols(fullTypeName);
        if (matchingSymbols.length === 1) {
            return generator.getSchemaForSymbol(matchingSymbols[0].name);
        } else {
            throw new Error(`${matchingSymbols.length} definitions found for requested type "${fullTypeName}".`);
        }
    } else {
        // Use specific type as root object
        return generator.getSchemaForSymbol(fullTypeName);
    }
}

export function programFromConfig(configFileName: string, onlyIncludeFiles?: string[]): ts.Program {
    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName)!);
    const configObject = result.config;

    const configParseResult = ts.parseJsonConfigFileContent(
        configObject,
        ts.sys,
        path.dirname(configFileName),
        {},
        path.basename(configFileName)
    );
    const options = configParseResult.options;
    options.noEmit = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;
    delete options.declarationDir;
    delete options.declarationMap;

    const program = ts.createProgram({
        rootNames: onlyIncludeFiles || configParseResult.fileNames,
        options,
        projectReferences: configParseResult.projectReferences,
    });
    return program;
}

function normalizeFileName(fn: string): string {
    while (fn.substr(0, 2) === "./") {
        fn = fn.substr(2);
    }
    return fn;
}

export function exec(filePattern: string, fullTypeName: string, args = getDefaultArgs()): void {
    let program: ts.Program;
    let onlyIncludeFiles: string[] | undefined = undefined;
    if (REGEX_TSCONFIG_NAME.test(path.basename(filePattern))) {
        if (args.include && args.include.length > 0) {
            const globs: string[][] = args.include.map((f) => glob.sync(f));
            onlyIncludeFiles = ([] as string[]).concat(...globs).map(normalizeFileName);
        }
        program = programFromConfig(filePattern, onlyIncludeFiles);
    } else {
        onlyIncludeFiles = glob.sync(filePattern);
        program = getProgramFromFiles(onlyIncludeFiles, {
            strictNullChecks: args.strictNullChecks,
        });
        onlyIncludeFiles = onlyIncludeFiles.map(normalizeFileName);
    }

    const definition = generateSchema(program, fullTypeName, args, onlyIncludeFiles);
    if (definition === null) {
        throw new Error("No output definition. Probably caused by errors prior to this?");
    }

    const json = stringify(definition, { space: 4 }) + "\n\n";
    if (args.out) {
        require("fs").writeFile(args.out, json, function (err: Error) {
            if (err) {
                throw new Error("Unable to write output file: " + err.message);
            }
        });
    } else {
        process.stdout.write(json);
    }
}
