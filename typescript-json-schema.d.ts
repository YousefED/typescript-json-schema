import * as ts from "typescript";
export { Program, CompilerOptions, Symbol } from "typescript";
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
    uniqueNames: boolean;
    rejectDateType: boolean;
    id: string;
};
export declare type PartialArgs = Partial<Args>;
export declare type PrimitiveType = number | boolean | string | null;
export declare type Definition = {
    $ref?: string;
    $schema?: string;
    $id?: string;
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
    } | Definition;
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
export declare type SymbolRef = {
    name: string;
    typeName: string;
    fullyQualifiedName: string;
    symbol: ts.Symbol;
};
export declare class JsonSchemaGenerator {
    private args;
    private tc;
    private symbols;
    private allSymbols;
    private userSymbols;
    private inheritingTypes;
    private reffedDefinitions;
    private userValidationKeywords;
    private typeNamesById;
    private typeNamesUsed;
    constructor(symbols: SymbolRef[], allSymbols: {
        [name: string]: ts.Type;
    }, userSymbols: {
        [name: string]: ts.Symbol;
    }, inheritingTypes: {
        [baseName: string]: string[];
    }, tc: ts.TypeChecker, args?: Args);
    readonly ReffedDefinitions: {
        [key: string]: Definition;
    };
    private parseCommentsIntoDefinition;
    private getDefinitionForRootType;
    private getReferencedTypeSymbol;
    private getDefinitionForProperty;
    private getEnumDefinition;
    private getUnionDefinition;
    private getIntersectionDefinition;
    private getClassDefinition;
    private getTypeName;
    private getTypeDefinition;
    setSchemaOverride(symbolName: string, schema: Definition): void;
    getSchemaForSymbol(symbolName: string, includeReffedDefinitions?: boolean): Definition;
    getSchemaForSymbols(symbolNames: string[], includeReffedDefinitions?: boolean): Definition;
    getSymbols(name?: string): SymbolRef[];
    getUserSymbols(): string[];
    getMainFileSymbols(program: ts.Program, onlyIncludeFiles?: string[]): string[];
}
export declare function getProgramFromFiles(files: string[], jsonCompilerOptions?: any, basePath?: string): ts.Program;
export declare function buildGenerator(program: ts.Program, args?: PartialArgs, onlyIncludeFiles?: string[]): JsonSchemaGenerator | null;
export declare function generateSchema(program: ts.Program, fullTypeName: string, args?: PartialArgs, onlyIncludeFiles?: string[]): Definition | null;
export declare function programFromConfig(configFileName: string, onlyIncludeFiles?: string[]): ts.Program;
export declare function exec(filePattern: string, fullTypeName: string, args?: Args): void;
