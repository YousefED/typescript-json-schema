import * as ts from "typescript";
export { Program, CompilerOptions } from "typescript";
export declare function getDefaultArgs(): Args;
export declare type ValidationKeywords = {
    [prop: string]: boolean;
};
export declare type Args = {
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
export declare type PartialArgs = Partial<Args>;
export declare type PrimitiveType = number | boolean | string | null;
export declare type Definition = {
    $ref?: string;
    description?: string;
    allOf?: Definition[];
    oneOf?: Definition[];
    anyOf?: Definition[];
    title?: string;
    type?: string | string[];
    definitions?: {
        [key: string]: any;
    };
    format?: string;
    items?: Definition | Definition[];
    minItems?: number;
    additionalItems?: {
        anyOf: Definition[];
    };
    enum?: PrimitiveType[] | Definition[];
    default?: PrimitiveType | Object;
    additionalProperties?: Definition | boolean;
    required?: string[];
    propertyOrder?: string[];
    properties?: {};
    defaultProperties?: string[];
    typeof?: "function";
};
export declare class JsonSchemaGenerator {
    private args;
    private static validationKeywords;
    private allSymbols;
    private userSymbols;
    private inheritingTypes;
    private tc;
    private reffedDefinitions;
    private userValidationKeywords;
    private typeNamesById;
    private typeNamesUsed;
    constructor(allSymbols: {
        [name: string]: ts.Type;
    }, userSymbols: {
        [name: string]: ts.Symbol;
    }, inheritingTypes: {
        [baseName: string]: string[];
    }, tc: ts.TypeChecker, args?: Args);
    readonly ReffedDefinitions: {
        [key: string]: Definition;
    };
    private parseValue(value);
    private parseCommentsIntoDefinition(symbol, definition, otherAnnotations);
    private extractLiteralValue(typ);
    private resolveTupleType(propertyType);
    private getDefinitionForRootType(propertyType, tc, reffedType, definition);
    private getReferencedTypeSymbol(prop, tc);
    private getDefinitionForProperty(prop, tc, node);
    private getEnumDefinition(clazzType, tc, definition);
    private getUnionDefinition(unionType, prop, tc, unionModifier, definition);
    private getClassDefinition(clazzType, tc, definition);
    private simpleTypesAllowedProperties;
    private addSimpleType(def, type);
    private makeNullable(def);
    private getTypeName(typ, tc);
    private getTypeDefinition(typ, tc, asRef?, unionModifier?, prop?, reffedType?, pairedSymbol?);
    setSchemaOverride(symbolName: string, schema: Definition): void;
    getSchemaForSymbol(symbolName: string, includeReffedDefinitions?: boolean): Definition;
    getSchemaForSymbols(symbolNames: string[], includeReffedDefinitions?: boolean): Definition;
    getUserSymbols(): string[];
    getMainFileSymbols(program: ts.Program): string[];
}
export declare function getProgramFromFiles(files: string[], compilerOptions?: ts.CompilerOptions): ts.Program;
export declare function buildGenerator(program: ts.Program, args?: PartialArgs): JsonSchemaGenerator | null;
export declare function generateSchema(program: ts.Program, fullTypeName: string, args?: PartialArgs): Definition | null;
export declare function programFromConfig(configFileName: string): ts.Program;
export declare function exec(filePattern: string, fullTypeName: string, args?: Args): void;
export declare function run(): void;
