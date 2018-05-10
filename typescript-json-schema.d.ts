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
    include: string[];
    excludePrivate: boolean;
};
export declare type PartialArgs = Partial<Args>;
export declare type PrimitiveType = number | boolean | string | null;
export declare type Definition = {
    $ref?: string;
    $schema?: string;
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
    properties?: {
        [key: string]: any;
    };
    defaultProperties?: string[];
    typeof?: "function";
};
export declare class JsonSchemaGenerator {
    private args;
    private tc;
    private allSymbols;
    private userSymbols;
    private inheritingTypes;
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
    private parseCommentsIntoDefinition(symbol, definition, otherAnnotations);
    private getDefinitionForRootType(propertyType, reffedType, definition);
    private getReferencedTypeSymbol(prop);
    private getDefinitionForProperty(prop, node);
    private getEnumDefinition(clazzType, definition);
    private getUnionDefinition(unionType, prop, unionModifier, definition);
    private getIntersectionDefinition(intersectionType, definition);
    private getClassDefinition(clazzType, definition);
    private getTypeName(typ);
    private getTypeDefinition(typ, asRef?, unionModifier?, prop?, reffedType?, pairedSymbol?);
    setSchemaOverride(symbolName: string, schema: Definition): void;
    getSchemaForSymbol(symbolName: string, includeReffedDefinitions?: boolean): Definition;
    getSchemaForSymbols(symbolNames: string[], includeReffedDefinitions?: boolean): Definition;
    getUserSymbols(): string[];
    getMainFileSymbols(program: ts.Program, onlyIncludeFiles?: string[]): string[];
}
export declare function getProgramFromFiles(files: string[], jsonCompilerOptions?: any, basePath?: string): ts.Program;
export declare function buildGenerator(program: ts.Program, args?: PartialArgs): JsonSchemaGenerator | null;
export declare function generateSchema(program: ts.Program, fullTypeName: string, args?: PartialArgs, onlyIncludeFiles?: string[]): Definition | null;
export declare function programFromConfig(configFileName: string, onlyIncludeFiles?: string[]): ts.Program;
export declare function exec(filePattern: string, fullTypeName: string, args?: Args): void;
