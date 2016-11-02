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
    out: any;
};
export declare class JsonSchemaGenerator {
    private args;
    private static validationKeywords;
    private static annotedValidationKeywordPattern;
    private allSymbols;
    private inheritingTypes;
    private tc;
    private sandbox;
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
        out: any;
    });
    readonly ReffedDefinitions: {
        [key: string]: any;
    };
    private copyValidationKeywords(comment, to, otherAnnotations);
    private copyDescription(comment, to);
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
    getSchemaForSymbol(symbolName: string, includeReffedDefinitions?: boolean): any;
    getSchemaForSymbols(symbols: {
        [name: string]: ts.Type;
    }): any;
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
    out: any;
}): any;
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
    out: any;
}): void;
export declare function run(): void;
