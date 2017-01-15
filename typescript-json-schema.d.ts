import * as ts from "typescript";
export declare function getDefaultArgs(): {
    useRef: boolean;
    useTypeAliasRef: boolean;
    useRootRef: boolean;
    useTitle: boolean;
    useDefaultProperties: boolean;
    disableExtraProperties: boolean;
    usePropertyOrder: boolean;
    generateRequired: boolean;
    strictNullChecks: boolean;
    out: string;
};
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
    items?: Definition;
    minItems?: number;
    additionalItems?: {
        anyOf: Definition;
    };
    enum?: string[] | Definition[];
    default?: string | number | boolean | Object;
    additionalProperties?: Definition;
    required?: string[];
    propertyOrder?: string[];
    properties?: {};
    defaultProperties?: string[];
};
export declare class JsonSchemaGenerator {
    private args;
    private static validationKeywords;
    private allSymbols;
    private inheritingTypes;
    private tc;
    private reffedDefinitions;
    constructor(allSymbols: {
        [name: string]: ts.Type;
    }, inheritingTypes: {
        [baseName: string]: string[];
    }, tc: ts.TypeChecker, args?: {
        useRef: boolean;
        useTypeAliasRef: boolean;
        useRootRef: boolean;
        useTitle: boolean;
        useDefaultProperties: boolean;
        disableExtraProperties: boolean;
        usePropertyOrder: boolean;
        generateRequired: boolean;
        strictNullChecks: boolean;
        out: string;
    });
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
    private getTypeDefinition(typ, tc, asRef?, unionModifier?, prop?, reffedType?);
    getSchemaForSymbol(symbolName: string, includeReffedDefinitions?: boolean): Definition;
    getSchemaForSymbols(symbols: {
        [name: string]: ts.Type;
    }): Definition;
}
export declare function getProgramFromFiles(files: string[], compilerOptions?: ts.CompilerOptions): ts.Program;
export declare function generateSchema(program: ts.Program, fullTypeName: string, args?: {
    useRef: boolean;
    useTypeAliasRef: boolean;
    useRootRef: boolean;
    useTitle: boolean;
    useDefaultProperties: boolean;
    disableExtraProperties: boolean;
    usePropertyOrder: boolean;
    generateRequired: boolean;
    strictNullChecks: boolean;
    out: string;
}): Definition;
export declare function programFromConfig(configFileName: string): ts.Program;
export declare function exec(filePattern: string, fullTypeName: string, args?: {
    useRef: boolean;
    useTypeAliasRef: boolean;
    useRootRef: boolean;
    useTitle: boolean;
    useDefaultProperties: boolean;
    disableExtraProperties: boolean;
    usePropertyOrder: boolean;
    generateRequired: boolean;
    strictNullChecks: boolean;
    out: string;
}): void;
export declare function run(): void;
