import * as glob from "glob";
import * as stringify from "json-stable-stringify";
import * as path from "path";
import * as ts from "typescript";
export { Program, CompilerOptions } from "typescript";


const vm = require("vm");

const REGEX_FILE_NAME = /".*"\./;
const REGEX_TSCONFIG_NAME = /^.*\.json$/;
const REGEX_TJS_JSDOC = /^-([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;

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
        excludePrivate: false,
    };
}

export type ValidationKeywords = {
  [prop: string]: boolean
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
    excludePrivate: boolean;
};

export type PartialArgs = Partial<Args>;

export type PrimitiveType = number | boolean | string | null;

export type Definition = {
    $ref?: string,
    description?: string,
    allOf?: Definition[],
    oneOf?: Definition[],
    anyOf?: Definition[],
    title?: string,
    type?: string | string[],
    definitions?: {[key: string]: any},
    format?: string,
    items?: Definition | Definition[],
    minItems?: number,
    additionalItems?: {
        anyOf: Definition[]
    },
    enum?: PrimitiveType[] | Definition[],
    default?: PrimitiveType | Object,
    additionalProperties?: Definition | boolean,
    required?: string[],
    propertyOrder?: string[],
    properties?: {},
    defaultProperties?: string[],

    typeof?: "function"
};

function extend(target: any, ..._: any[]) {
    if (target == null) { // TypeError if undefined or null
      throw new TypeError("Cannot convert undefined or null to object");
    }

    const to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
      const nextSource = arguments[index];

      if (nextSource != null) { // Skip over if undefined or null
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

export class JsonSchemaGenerator {
    /**
     * JSDoc keywords that should be used to annotate the JSON schema.
     *
     * Many of these validation keywords are defined here: http://json-schema.org/latest/json-schema-validation.html
     */
    private static validationKeywords = {
        multipleOf: true,               // 6.1.
        maximum: true,                  // 6.2.
        exclusiveMaximum: true,         // 6.3.
        minimum: true,                  // 6.4.
        exclusiveMinimum: true,         // 6.5.
        maxLength: true,                // 6.6.
        minLength: true,                // 6.7.
        pattern: true,                  // 6.8.
        // items: true,                    // 6.9.
        // additionalItems: true,          // 6.10.
        maxItems: true,                 // 6.11.
        minItems: true,                 // 6.12.
        uniqueItems: true,              // 6.13.
        // contains: true,                 // 6.14.
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

        ignore: true,
        description: true,
        format: true,
        default: true,
        $ref: true,
        id: true
    };

    private allSymbols: { [name: string]: ts.Type };
    private userSymbols: { [name: string]: ts.Symbol };
    private inheritingTypes: { [baseName: string]: string[] };
    private tc: ts.TypeChecker;

    private reffedDefinitions: { [key: string]: Definition } = {};
    private userValidationKeywords: ValidationKeywords;

    private typeNamesById: { [id: number]: string } = {};
    private typeNamesUsed: { [name: string]: boolean } = {};

    constructor(
      allSymbols: { [name: string]: ts.Type },
      userSymbols: { [name: string]: ts.Symbol },
      inheritingTypes: { [baseName: string]: string[] },
      tc: ts.TypeChecker,
      private args = getDefaultArgs(),
    ) {
        this.allSymbols = allSymbols;
        this.userSymbols = userSymbols;
        this.inheritingTypes = inheritingTypes;
        this.tc = tc;
        this.userValidationKeywords = args.validationKeywords.reduce(
          (acc, word) => ({ ...acc, [word]: true }),
          {}
        );
    }

    public get ReffedDefinitions(): { [key: string]: Definition } {
        return this.reffedDefinitions;
    }

    /**
     * Try to parse a value and returns the string if it fails.
     */
    private parseValue(value: string) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return value;
        }
    }

    /**
     * Parse the comments of a symbol into the definition and other annotations.
     */
    private parseCommentsIntoDefinition(symbol: ts.Symbol, definition: {description?: string}, otherAnnotations: {}): void {
        if (!symbol) {
            return;
        }

        // the comments for a symbol
        let comments = symbol.getDocumentationComment();

        if (comments.length) {
            definition.description = comments.map(comment => comment.kind === "lineBreak" ? comment.text : comment.text.trim().replace(/\r\n/g, "\n")).join("");
        }

        // jsdocs are separate from comments
        const jsdocs = symbol.getJsDocTags();
        jsdocs.forEach(doc => {
            // if we have @TJS-... annotations, we have to parse them
            const [name, text] = (doc.name === "TJS" ? new RegExp(REGEX_TJS_JSDOC).exec(doc.text!)!.slice(1,3) : [doc.name, doc.text]) as string[];
            if (JsonSchemaGenerator.validationKeywords[name] || this.userValidationKeywords[name]) {
                definition[name] = this.parseValue(text);
            } else {
                // special annotations
                otherAnnotations[doc.name] = true;
            }
        });
    }

    private extractLiteralValue(typ: ts.Type): PrimitiveType | undefined {
        let str = (<ts.LiteralType>typ).value;
        if (str === undefined) {
            str = (typ as any).text;
        }
        if (typ.flags & ts.TypeFlags.EnumLiteral) {
            // or .text for old TS
            let num = parseFloat(str as string);
            return isNaN(num) ? str : num;
        } else if (typ.flags & ts.TypeFlags.StringLiteral) {
            return str;
        } else if (typ.flags & ts.TypeFlags.NumberLiteral) {
            return parseFloat(str as string);
        } else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
            return (typ as any).intrinsicName === "true";
        }
        return undefined;
    }

    /**
     * Checks whether a type is a tuple type.
     */
    private resolveTupleType(propertyType: ts.Type): ts.TupleTypeNode|null {
        if (!propertyType.getSymbol() && (propertyType.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Reference)) {
            return (propertyType as ts.TypeReference).target as any;
        }
        if (!(propertyType.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Tuple)) {
            return null;
        }
        return propertyType as any;
    }

    private getDefinitionForRootType(propertyType: ts.Type, tc: ts.TypeChecker, reffedType: ts.Symbol, definition: Definition) {
        const symbol = propertyType.getSymbol();

        const tupleType = this.resolveTupleType(propertyType);

        if (tupleType) { // tuple
            const elemTypes: ts.NodeArray<ts.TypeNode> = tupleType.elementTypes || (propertyType as any).typeArguments;
            const fixedTypes = elemTypes.map(elType => this.getTypeDefinition(elType as any, tc));
            definition.type = "array";
            definition.items = fixedTypes;
            definition.minItems = fixedTypes.length;
            definition.additionalItems = {
                anyOf: fixedTypes
            };
        } else {
            const propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

            switch (propertyTypeString.toLowerCase()) {
                case "string":
                    definition.type = "string";
                    break;
                case "number":
                    const isInteger = (definition.type === "integer" || (reffedType && reffedType.getName() === "integer"));
                    definition.type = isInteger ? "integer" : "number";
                    break;
                case "boolean":
                    definition.type = "boolean";
                    break;
                case "null":
                    definition.type = "null";
                    break;
                case "undefined":
                    definition.type = "undefined";
                    break;
                case "any":
                    // no type restriction, so that anything will match
                    break;
                case "date":
                    definition.type = "string";
                    definition.format = "date-time";
                    break;
                default:
                    const value = this.extractLiteralValue(propertyType);
                    if (value !== undefined) {
                        definition.type = typeof value;
                        definition.enum = [ value ];
                    } else if (symbol && (symbol.getName() === "Array" || symbol.getName() === "ReadonlyArray")) {
                        const arrayType = (<ts.TypeReference>propertyType).typeArguments![0];
                        definition.type = "array";
                        definition.items = this.getTypeDefinition(arrayType, tc);
                    } else {
                        // Report that type could not be processed
                        let info: any = propertyType;
                        try {
                            info = JSON.stringify(propertyType);
                        } catch(err) {}
                        console.error("Unsupported type: ", info);
                        // definition = this.getTypeDefinition(propertyType, tc);
                    }
            }
        }

        return definition;
    }

    private getReferencedTypeSymbol(prop: ts.Symbol, tc: ts.TypeChecker): ts.Symbol|undefined {
        const decl = prop.getDeclarations();
        if (decl && decl.length) {
            const type = (<ts.TypeReferenceNode> (<any> decl[0]).type);
            if (type && (type.kind & ts.SyntaxKind.TypeReference) && type.typeName) {
                return tc.getSymbolAtLocation(type.typeName);
            }
        }
        return undefined;
    }

    private getDefinitionForProperty(prop: ts.Symbol, tc: ts.TypeChecker, node: ts.Node) {
        const propertyName = prop.getName();
        const propertyType = tc.getTypeOfSymbolAtLocation(prop, node);

        const reffedType = this.getReferencedTypeSymbol(prop, tc);

        let definition = this.getTypeDefinition(propertyType, tc, undefined, undefined, prop, reffedType);

        if (this.args.titles) {
            definition.title = propertyName;
        }

        if (definition.hasOwnProperty("ignore")) {
            return null;
        }

        // try to get default value
        let valDecl = prop.valueDeclaration as ts.VariableDeclaration;
        if (valDecl && valDecl.initializer) {
            const initial = valDecl.initializer;
            if ((<any>initial).expression) { // node
                console.warn("initializer is expression for property " + propertyName);
            } else if ((<any>initial).kind && (<any>initial).kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                definition.default = initial.getText();
            } else {
                try {
                    const sandbox = { sandboxvar: null as any };
                    vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);

                    const val = sandbox.sandboxvar;
                    if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean" || Object.prototype.toString.call(val) === "[object Array]") {
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

    private getEnumDefinition(clazzType: ts.Type, tc: ts.TypeChecker, definition: Definition): Definition {
        const node = clazzType.getSymbol()!.getDeclarations()![0];
        const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        const members: ts.NodeArray<ts.EnumMember> = node.kind === ts.SyntaxKind.EnumDeclaration ?
            (node as ts.EnumDeclaration).members :
            ts.createNodeArray([node as ts.EnumMember]);
        var enumValues: (number|boolean|string|null)[] = [];
        let enumTypes: string[] = [];

        const addType = (type: string) => {
            if (enumTypes.indexOf(type) === -1) {
                enumTypes.push(type);
            }
        };

        members.forEach(member => {
            const caseLabel = (<ts.Identifier>member.name).text;
            const constantValue = tc.getConstantValue(member);
            if (constantValue !== undefined) {
                enumValues.push(constantValue);
                addType(typeof constantValue);
            } else {
                // try to extract the enums value; it will probably by a cast expression
                let initial: ts.Expression|undefined = member.initializer;
                if (initial) {
                    if ((<any>initial).expression) { // node
                        const exp = (<any>initial).expression;
                        const text = (<any>exp).text;
                        // if it is an expression with a text literal, chances are it is the enum convension:
                        // CASELABEL = 'literal' as any
                        if (text) {
                            enumValues.push(text);
                            addType("string");
                        } else if (exp.kind === ts.SyntaxKind.TrueKeyword || exp.kind === ts.SyntaxKind.FalseKeyword) {
                            enumValues.push((exp.kind === ts.SyntaxKind.TrueKeyword));
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
            definition.type = (enumTypes.length === 1) ? enumTypes[0] : enumTypes;
        }

        if (enumValues.length > 0) {
            definition.enum = enumValues.sort();
        }

        return definition;
    }

    private getUnionDefinition(unionType: ts.UnionType, prop: ts.Symbol, tc: ts.TypeChecker, unionModifier: string, definition: Definition) {
        const enumValues: PrimitiveType[] = [];
        const simpleTypes: string[] = [];
        const schemas: Definition[] = [];

        const addSimpleType = (type: string) => {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };

        const addEnumValue = (val: PrimitiveType) => {
            if (enumValues.indexOf(val) === -1) {
                enumValues.push(val);
            }
        };

        for (let i = 0; i < unionType.types.length; ++i) {
            const valueType = unionType.types[i];
            const value = this.extractLiteralValue(valueType);
            if (value !== undefined) {
                addEnumValue(value);
            } else {
                const def = this.getTypeDefinition(unionType.types[i], tc);
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
                            addSimpleType(def.type);
                        }
                    } else {
                        schemas.push(def);
                    }
                }
            }
        }

        if (enumValues.length > 0) {
            // If the values are true and false, just add "boolean" as simple type
            const isOnlyBooleans = enumValues.length === 2 &&
                typeof enumValues[0] === "boolean" &&
                typeof enumValues[1] === "boolean" &&
                enumValues[0] !== enumValues[1];

            if (isOnlyBooleans) {
                addSimpleType("boolean");
            } else {
                const enumSchema: Definition = { enum: enumValues.sort() };

                // If all values are of the same primitive type, add a "type" field to the schema
                if (enumValues.every((x) => { return typeof x === "string"; })) {
                    enumSchema.type = "string";
                } else if (enumValues.every((x) => { return typeof x === "number"; })) {
                    enumSchema.type = "number";
                } else if (enumValues.every((x) => { return typeof x === "boolean"; })) {
                    enumSchema.type = "boolean";
                }

                schemas.push(enumSchema);
            }
        }

        if (simpleTypes.length > 0) {
            schemas.push({ type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes });
        }

        if (schemas.length === 1) {
            for (let k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k];
                }
            }
        } else {
            definition[unionModifier] = schemas;
        }
        return definition;
    }

    private getClassDefinition(clazzType: ts.Type, tc: ts.TypeChecker, definition: Definition): Definition {
        const node = clazzType.getSymbol()!.getDeclarations()![0];
        if (this.args.typeOfKeyword && node.kind === ts.SyntaxKind.FunctionType) {
            definition.typeof = "function";
            return definition;
        }

        const clazz = <ts.ClassDeclaration>node;
        const props = tc.getPropertiesOfType(clazzType).filter(prop => {
            if (!this.args.excludePrivate) {
                return true;
            }

            let decls = prop.declarations;
            return !(decls && decls.filter(decl => {
                let mods = decl.modifiers;
                return mods && mods.filter(mod => mod.kind === ts.SyntaxKind.PrivateKeyword).length > 0;
            }).length > 0);
        });
        const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

        const modifierFlags = ts.getCombinedModifierFlags(node);

        if (modifierFlags & ts.ModifierFlags.Abstract) {
            const oneOf = this.inheritingTypes[fullName].map((typename) => {
                return this.getTypeDefinition(this.allSymbols[typename], tc);
            });

            definition.oneOf = oneOf;
        } else {
            if (clazz.members) {
                const indexSignatures = clazz.members == null ? [] : clazz.members.filter(x => x.kind === ts.SyntaxKind.IndexSignature);
                if (indexSignatures.length === 1) {
                    // for case "array-types"
                    const indexSignature = indexSignatures[0] as ts.IndexSignatureDeclaration;
                    if (indexSignature.parameters.length !== 1) {
                        throw new Error("Not supported: IndexSignatureDeclaration parameters.length != 1");
                    }
                    const indexSymbol: ts.Symbol = (<any>indexSignature.parameters[0]).symbol;
                    const indexType = tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                    const isStringIndexed = (indexType.flags === ts.TypeFlags.String);
                    if (indexType.flags !== ts.TypeFlags.Number && !isStringIndexed) {
                        throw new Error("Not supported: IndexSignatureDeclaration with index symbol other than a number or a string");
                    }

                    const typ = tc.getTypeAtLocation(indexSignature.type!);
                    const def = this.getTypeDefinition(typ, tc, undefined, "anyOf");

                    if (isStringIndexed) {
                        definition.type = "object";
                        definition.additionalProperties = def;
                    } else {
                        definition.type = "array";
                        definition.items = def;
                    }
                }
            }

            const propertyDefinitions = props.reduce((all, prop) => {
                const propertyName = prop.getName();
                const propDef = this.getDefinitionForProperty(prop, tc, node);
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
                    let def = {};
                    this.parseCommentsIntoDefinition(prop, def, {});
                    if (!(prop.flags & ts.SymbolFlags.Optional) && !(<any>prop).mayBeUndefined && !def.hasOwnProperty("ignore")) {
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

    private simpleTypesAllowedProperties = {
        type: true,
        description: true
    };

    private addSimpleType(def: Definition, type: string) {
        for (let k in def) {
            if (!this.simpleTypesAllowedProperties[k]) {
                return false;
            }
        }

        if (!def.type) {
            def.type = type;
        } else if (typeof def.type !== "string") {
            if (!(<Object[]>def.type).every((val) => { return typeof val === "string"; })) {
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
                def.type = [ def.type, "null" ];
            }
        }
        return true;
    }

    private makeNullable(def: Definition) {
        if (!this.addSimpleType(def, "null")) {
            let union = def.oneOf || def.anyOf;
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
                def.anyOf = [ subdef, { type: "null" } ];
            }
        }
        return def;
    }

    /**
     * Gets/generates a globally unique type name for the given type
     */
    private getTypeName(typ: ts.Type, tc: ts.TypeChecker) {
        const id = (typ as any).id as number;
        if (this.typeNamesById[id]) { // Name already assigned?
            return this.typeNamesById[id];
        }

        const baseName = tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        let name = baseName;
        if (this.typeNamesUsed[name]) { // If a type with same name exists
            for (let i = 1; true; ++i) { // Try appending "_1", "_2", etc.
                name = baseName + "_" + i;
                if (!this.typeNamesUsed[name]) {
                    break;
                }
            }
        }

        this.typeNamesById[id] = name;
        this.typeNamesUsed[name] = true;
        return name;
    }

    private getTypeDefinition(typ: ts.Type, tc: ts.TypeChecker, asRef = this.args.ref, unionModifier: string = "anyOf", prop?: ts.Symbol, reffedType?: ts.Symbol, pairedSymbol?: ts.Symbol): Definition {
        const definition: Definition = {}; // real definition

        if (this.args.typeOfKeyword && (typ.flags & ts.TypeFlags.Object) && ((<ts.ObjectType>typ).objectFlags & ts.ObjectFlags.Anonymous)) {
            definition.typeof = "function";
            return definition;
        }

        let returnedDefinition = definition; // returned definition, may be a $ref

        const symbol = typ.getSymbol();
        const isRawType = (!symbol || symbol.name === "integer" || symbol.name === "Array" || symbol.name === "ReadonlyArray" || symbol.name === "Date");

        // special case: an union where all child are string literals -> make an enum instead
        let isStringEnum = false;
        if (typ.flags & ts.TypeFlags.Union) {
            const unionType = <ts.UnionType>typ;
            isStringEnum = (unionType.types.every(propType => {
                return (propType.getFlags() & ts.TypeFlags.StringLiteral) !== 0;
            }));
        }

        // aliased types must be handled slightly different
        const asTypeAliasRef = asRef && reffedType && (this.args.aliasRef || isStringEnum);
        if (!asTypeAliasRef) {
            if (isRawType || typ.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>typ).objectFlags & ts.ObjectFlags.Anonymous) {
                asRef = false;  // raw types and inline types cannot be reffed,
                                // unless we are handling a type alias
            }
        }

        let fullTypeName = "";
        if (asTypeAliasRef) {
            fullTypeName = tc.getFullyQualifiedName(
                reffedType!.getFlags() & ts.SymbolFlags.Alias ?
                    tc.getAliasedSymbol(reffedType!) :
                    reffedType!
            ).replace(REGEX_FILE_NAME, "");
        } else if (asRef) {
            fullTypeName = this.getTypeName(typ, tc);
        }

        if (asRef) {
            returnedDefinition = {
                $ref:  "#/definitions/" + fullTypeName
            };
        }

        // Parse comments
        const otherAnnotations = {};
        this.parseCommentsIntoDefinition(reffedType!, definition, otherAnnotations); // handle comments in the type alias declaration
        if (prop) {
            this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations);
        }
        this.parseCommentsIntoDefinition(symbol!, definition, otherAnnotations);

        // Create the actual definition only if is an inline definition, or
        // if it will be a $ref and it is not yet created
        if (!asRef || !this.reffedDefinitions[fullTypeName]) {
            if (asRef) { // must be here to prevent recursivity problems
                this.reffedDefinitions[fullTypeName] = asTypeAliasRef && reffedType!.getFlags() & ts.TypeFlags.IndexedAccess && symbol ? this.getTypeDefinition(typ, tc, true, undefined, symbol, symbol) : definition;
                if (this.args.titles && fullTypeName) {
                    definition.title = fullTypeName;
                }
            }
            const node = symbol && symbol.getDeclarations() !== undefined ? symbol.getDeclarations()![0] : null;

            if (definition.type === undefined) {  // if users override the type, do not try to infer it
                if (typ.flags & ts.TypeFlags.Union) {
                    this.getUnionDefinition(typ as ts.UnionType, prop!, tc, unionModifier, definition);
                } else if (typ.flags & ts.TypeFlags.Intersection) {
                    // extend object instead of using allOf because allOf does not work well with additional properties. See #107
                    if (this.args.noExtraProps) {
                        definition.additionalProperties = false;
                    }

                    const types = (<ts.IntersectionType> typ).types;
                    for (let i = 0; i < types.length; ++i) {
                        const other = this.getTypeDefinition(types[i], tc, false);
                        definition.type = other.type;  // should always be object
                        definition.properties = extend(definition.properties || {}, other.properties);
                        if (Object.keys(other.default || {}).length > 0) {
                            definition.default = extend(definition.default || {}, other.default);
                        }
                        if (other.required) {
                            definition.required = unique((definition.required || []).concat(other.required)).sort();
                        }
                    }
                } else if (isRawType) {
                    if (pairedSymbol) {
                        this.parseCommentsIntoDefinition(pairedSymbol, definition, {});
                    }
                    this.getDefinitionForRootType(typ, tc, reffedType!, definition);
                } else if (node && (node.kind === ts.SyntaxKind.EnumDeclaration || node.kind === ts.SyntaxKind.EnumMember)) {
                    this.getEnumDefinition(typ, tc, definition);
                } else if (symbol && symbol.flags & ts.SymbolFlags.TypeLiteral && symbol.members!.size === 0) {
                    // {} is TypeLiteral with no members. Need special case because it doesn't have declarations.
                    definition.type = "object";
                    definition.properties = {};
                } else {
                    this.getClassDefinition(typ, tc, definition);
                }
            }
        }

        if (otherAnnotations["nullable"]) {
            this.makeNullable(returnedDefinition);
        }

        return returnedDefinition;
    }

    public setSchemaOverride(symbolName: string, schema: Definition) {
        this.reffedDefinitions[symbolName] = schema;
    }

    public getSchemaForSymbol(symbolName: string, includeReffedDefinitions: boolean = true): Definition {
        if(!this.allSymbols[symbolName]) {
            throw new Error(`type ${symbolName} not found`);
        }
        let def = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName] || undefined);

        if (this.args.ref && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            def.definitions = this.reffedDefinitions;
        }
        def["$schema"] = "http://json-schema.org/draft-04/schema#";
        return def;
    }

    public getSchemaForSymbols(symbolNames: string[], includeReffedDefinitions: boolean = true): Definition {
        const root = {
            $schema: "http://json-schema.org/draft-04/schema#",
            definitions: {}
        };
        for (let i = 0; i < symbolNames.length; i++) {
            const symbolName = symbolNames[i];
            root.definitions[symbolName] = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName]);
        }
        if (this.args.ref && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            root.definitions = {...root.definitions, ... this.reffedDefinitions};
        }
        return root;
    }

    public getUserSymbols(): string[] {
        return Object.keys(this.userSymbols);
    }

    public getMainFileSymbols(program: ts.Program): string[] {
        const files = program.getSourceFiles().filter(file => !file.isDeclarationFile);
        if (files.length) {
            return Object.keys(this.userSymbols).filter((key) => {
                const symbol = this.userSymbols[key];
                if (!symbol || !symbol.declarations || !symbol.declarations.length) {
                    return false;
                }
                let node: ts.Node = symbol.declarations[0];
                while (node && node.parent) {
                    node = node.parent;
                }
                return files.indexOf(node.getSourceFile()) > -1;
            });
        }
        return [];
    }
}

export function getProgramFromFiles(files: string[], compilerOptions: ts.CompilerOptions = {}): ts.Program {
    // use built-in default options
    const options: ts.CompilerOptions = {
        noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    };
    for (const k in compilerOptions) {
        if (compilerOptions.hasOwnProperty(k)) {
            options[k] = compilerOptions[k];
        }
    }
    return ts.createProgram(files, options);
}

export function buildGenerator(program: ts.Program, args: PartialArgs = {}): JsonSchemaGenerator|null {
    // Use defaults unles otherwise specified
    let settings = getDefaultArgs();

    for (const pref in args) {
        if (args.hasOwnProperty(pref)) {
            settings[pref] = args[pref];
        }
    }

    const typeChecker = program.getTypeChecker();

    var diagnostics = ts.getPreEmitDiagnostics(program);

    if (diagnostics.length === 0 || args.ignoreErrors) {

        const allSymbols: { [name: string]: ts.Type } = {};
        const userSymbols: { [name: string]: ts.Symbol } = {};
        const inheritingTypes: { [baseName: string]: string[] } = {};

        program.getSourceFiles().forEach((sourceFile, _sourceFileIdx) => {
            function inspect(node: ts.Node, tc: ts.TypeChecker) {

                if (node.kind === ts.SyntaxKind.ClassDeclaration
                  || node.kind === ts.SyntaxKind.InterfaceDeclaration
                  || node.kind === ts.SyntaxKind.EnumDeclaration
                  || node.kind === ts.SyntaxKind.TypeAliasDeclaration
                ) {
                    const symbol: ts.Symbol = (<any>node).symbol;
                    let fullName = tc.getFullyQualifiedName(symbol);

                    const nodeType = tc.getTypeAtLocation(node);

                    // remove file name
                    // TODO: we probably don't want this eventually,
                    // as same types can occur in different files and will override eachother in allSymbols
                    // This means atm we can't generate all types in large programs.
                    fullName = fullName.replace(/".*"\./, "");

                    allSymbols[fullName] = nodeType;

                    // if (sourceFileIdx === 1) {
                    if (!sourceFile.hasNoDefaultLib) {
                        userSymbols[fullName] = symbol;
                    }

                    const baseTypes = nodeType.getBaseTypes() || [];

                    baseTypes.forEach(baseType => {
                        var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        if (!inheritingTypes[baseName]) {
                            inheritingTypes[baseName] = [];
                        }
                        inheritingTypes[baseName].push(fullName);
                    });
                } else {
                    ts.forEachChild(node, n => inspect(n, tc));
                }
            }
            inspect(sourceFile, typeChecker);
        });

        return new JsonSchemaGenerator(allSymbols, userSymbols, inheritingTypes, typeChecker, settings);
    } else {
        diagnostics.forEach((diagnostic) => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if(diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            } else {
                console.error(message);
            }
        });
        return null;
    }
}

export function generateSchema(program: ts.Program, fullTypeName: string, args: PartialArgs = {}): Definition|null {
    const generator = buildGenerator(program, args);

    if (generator === null) {
        return null;
    }

    let definition: Definition;
    if (fullTypeName === "*") { // All types in file(s)
        definition = generator.getSchemaForSymbols(generator.getMainFileSymbols(program));
    } else { // Use specific type as root object
        definition = generator.getSchemaForSymbol(fullTypeName);
    }
    return definition;
}

export function programFromConfig(configFileName: string): ts.Program {
    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName)!);
    const configObject = result.config;

    const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, configFileName);
    const options = configParseResult.options;
    options.noEmit = true;
    delete options.out;
    delete options.outDir;
    delete options.outFile;
    delete options.declaration;

    const program = ts.createProgram(configParseResult.fileNames, options);
    return program;
}

export function exec(filePattern: string, fullTypeName: string, args = getDefaultArgs()) {
    let program: ts.Program;
    if (REGEX_TSCONFIG_NAME.test(path.basename(filePattern))) {
        program = programFromConfig(filePattern);
    } else {
        program = getProgramFromFiles(glob.sync(filePattern), {
            strictNullChecks: args.strictNullChecks
        });
    }

    const definition = generateSchema(program, fullTypeName, args);
    if (definition === null) {
        return;
    }

    const json = stringify(definition, {space: 4}) + "\n\n";
    if (args.out) {
        require("fs").writeFile(args.out, json, function(err: Error) {
            if (err) {
                console.error("Unable to write output file: " + err.message);
            }
        });
    } else {
        process.stdout.write(json);
    }
}

export function run() {
    var helpText = "Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>";
    const defaultArgs = getDefaultArgs();
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

    exec(args._[0], args._[1], {
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

if (typeof window === "undefined" && require.main === module) {
    run();
}

// exec("example/**/*.ts", "Invoice");
/*
let args = defaultArgs;
args.useRootRef = true;
const result = generateSchema(getProgramFromFiles(["test/programs/interface-recursion/main.ts"]), "MyObject", args);
console.log(JSON.stringify(result));
*/
