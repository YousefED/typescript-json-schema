import * as ts from "typescript"
import * as glob from "glob"
import * as path from "path"
import * as stringify from "json-stable-stringify"
import * as vm from "vm"
import { Argv } from "yargs"

const REGEX_FILE_NAME = /".*"\./
const REGEX_TJS_JSDOC = /^-([\w]+)\s([\w]+)/g

export type ValidationKeywords = {
    [prop: string]: boolean
}

export class Args {
    useRef = true
    useTypeAliasRef = false
    useRootRef = false
    useTitle = false
    useDefaultProperties = false
    disableExtraProperties = false
    usePropertyOrder = false
    useTypeOfKeyword = false
    ignoreObjectMethods = false
    generateRequired = false
    strictNullChecks = false
    ignoreErrors = false
    out = ""
    validationKeywords: string[] = []
}

export type PartialArgs = Partial<Args>

export type PrimitiveType = number | boolean | string | null

export type Definition = {
    $ref?: string,
    description?: string,
    allOf?: Definition[],
    oneOf?: Definition[],
    anyOf?: Definition[],
    title?: string,
    type?: string | string[],
    definitions?: { [key: string]: any },
    format?: string,
    items?: Definition,
    minItems?: number,
    additionalItems?: {
        anyOf: Definition
    },
    enum?: PrimitiveType[] | Definition[],
    default?: PrimitiveType | Object,
    additionalProperties?: Definition,
    required?: string[],
    propertyOrder?: string[],
    properties?: {},
    defaultProperties?: string[],
    ignore?: boolean,

    typeof?: "function"
}

export class JsonSchemaGenerator {
    /**
     * JSDoc keywords that should be used to annotate the JSON schema.
     */
    private static validationKeywords = {
        ignore: true,
        description: true,
        type: true,
        minimum: true,
        exclusiveMinimum: true,
        maximum: true,
        exclusiveMaximum: true,
        multipleOf: true,
        minLength: true,
        maxLength: true,
        format: true,
        pattern: true,
        minItems: true,
        maxItems: true,
        uniqueItems: true,
        default: true,
        additionalProperties: true,
        enum: true
    }

    private reffedDefinitions: { [key: string]: Definition } = {}
    private userValidationKeywords: ValidationKeywords

    constructor(
        private allSymbols: { [name: string]: ts.Type },
        private userSymbols: { [name: string]: ts.Type },
        private inheritingTypes: { [baseName: string]: string[] },
        private tc: ts.TypeChecker,
        private args = new Args(),
    ) {
        this.userValidationKeywords = args.validationKeywords.reduce(
            (acc, word) => ({ ...acc, [word]: true }),
            {}
        )
    }

    public get ReffedDefinitions(): { [key: string]: Definition } {
        return this.reffedDefinitions
    }

    /**
     * Try to parse a value and returns the string if it fails.
     */
    private parseValue(value: string) {
        try {
            return JSON.parse(value)
        } catch (error) {
            return value
        }
    }

    /**
     * Parse the comments of a symbol into the definition and other annotations.
     */
    private parseCommentsIntoDefinition(symbol: ts.Symbol, definition: { description?: string }, otherAnnotations: {}): void {
        if (!symbol) {
            return
        }

        // the comments for a symbol
        let comments = symbol.getDocumentationComment()
        if (comments.length) {
            definition.description = comments.map(comment => comment.kind === "lineBreak" ? comment.text : comment.text.trim().replace(/\r\n/g, "\n")).join("")
        }

        // jsdocs are separate from comments
        symbol.getJsDocTags().forEach(doc => {
            // if we have @TJS-... annotations, we have to parse them
            const [name, text] = (doc.name === "TJS" ? new RegExp(REGEX_TJS_JSDOC).exec(doc.text!)!.slice(1, 3) : [doc.name, doc.text]) as string[]
            if (JsonSchemaGenerator.validationKeywords[name] || this.userValidationKeywords[name]) {
                definition[name] = this.parseValue(text)
            } else {
                // special annotations
                otherAnnotations[doc.name] = true
            }
        })
    }

    private extractLiteralValue(typ: ts.Type): PrimitiveType | undefined {
        if (typ.flags & ts.TypeFlags.EnumLiteral) {
            let str = (<ts.LiteralType>typ).text
            let num = parseFloat(str)
            return isNaN(num) ? str : num
        } else if (typ.flags & ts.TypeFlags.StringLiteral) {
            return (<ts.LiteralType>typ).text
        } else if (typ.flags & ts.TypeFlags.NumberLiteral) {
            return parseFloat((<ts.LiteralType>typ).text)
        } else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
            return (typ as any).intrinsicName === "true"
        }
        return undefined
    }

    /**
     * Checks whether a type is a tuple type.
     */
    private resolveTupleType(propertyType: ts.Type): ts.TupleTypeNode | null {
        if (!propertyType.getSymbol() && (propertyType.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Reference)) {
            return (propertyType as ts.TypeReference).target as any
        }
        if (!(propertyType.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>propertyType).objectFlags & ts.ObjectFlags.Tuple)) {
            return null
        }
        return propertyType as any
    }

    private getDefinitionForRootType(propertyType: ts.Type, tc: ts.TypeChecker, reffedType: ts.Symbol, definition: Definition) {
        const symbol = propertyType.getSymbol()

        const tupleType = this.resolveTupleType(propertyType)

        if (tupleType) { // tuple
            const elemTypes: ts.NodeArray<ts.TypeNode> = tupleType.elementTypes || (propertyType as any).typeArguments
            const fixedTypes = elemTypes.map(elType => this.getTypeDefinition(elType as any, tc))
            definition.type = "array"
            definition.items = fixedTypes
            definition.minItems = fixedTypes.length
            definition.additionalItems = {
                "anyOf": fixedTypes
            }
        } else {
            const propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType).toLowerCase()
            switch (propertyTypeString) {
                case "string":
                case "boolean":
                case "null":
                case "undefined":
                    definition.type = propertyTypeString
                    break

                case "number":
                    const isInteger = (definition.type === "integer" || (reffedType && reffedType.getName() === "integer"))
                    definition.type = isInteger ? "integer" : "number"
                    break

                case "any":
                    // no type restriction, so that anything will match
                    break

                case "date":
                    definition.type = "string"
                    definition.format = "date-time"
                    break

                default:
                    const value = this.extractLiteralValue(propertyType)
                    if (value !== undefined) {
                        definition.type = typeof value
                        definition.enum = [value]
                    } else if (symbol && (symbol.getName() === "Array" || symbol.getName() === "ReadonlyArray")) {
                        const arrayType = (<ts.TypeReference>propertyType).typeArguments[0]
                        definition.type = "array"
                        definition.items = this.getTypeDefinition(arrayType, tc)
                    } else {
                        // Report that type could not be processed
                        let info: any
                        try {
                            info = JSON.stringify(propertyType)
                        } catch (err) {
                            info = propertyType
                        }
                        console.error("Unsupported type: ", info)
                        // definition = this.getTypeDefinition(propertyType, tc)
                    }
            }
        }

        return definition
    }

    private getReferencedTypeSymbol(prop: ts.Symbol, tc: ts.TypeChecker): ts.Symbol | undefined {
        const decl = prop.getDeclarations()
        if (decl && decl.length) {
            const type = (<ts.TypeReferenceNode>(<any>decl[0]).type)
            if (type && (type.kind & ts.SyntaxKind.TypeReference) && type.typeName) {
                return tc.getSymbolAtLocation(type.typeName)
            }
        }
        return undefined
    }

    private getDefinitionForProperty(prop: ts.Symbol, tc: ts.TypeChecker, node: ts.Node) {
        const propertyName = prop.getName()
        const propertyType = tc.getTypeOfSymbolAtLocation(prop, node)

        const reffedType = this.getReferencedTypeSymbol(prop, tc)

        let definition = this.getTypeDefinition(propertyType, tc, undefined, undefined, prop, reffedType)
        if (this.args.useTitle) {
            definition.title = propertyName
        }

        if (definition.hasOwnProperty("ignore")) {
            return null
        }

        // try to get default value
        let initial = (<ts.VariableDeclaration>prop.valueDeclaration).initializer

        if (initial) {
            if ((<any>initial).expression) { // node
                console.warn("initializer is expression for property " + propertyName)
            } else if ((<any>initial).kind && (<any>initial).kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                definition.default = initial.getText()
            } else {
                try {
                    const sandbox = { sandboxvar: null as any }
                    vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox)

                    const val = sandbox.sandboxvar
                    if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean" || Object.prototype.toString.call(val) === "[object Array]") {
                        definition.default = val
                    } else if (val) {
                        console.warn("unknown initializer for property " + propertyName + ": " + val)
                    }
                } catch (e) {
                    console.warn("exception evaluating initializer for property " + propertyName)
                }
            }
        }

        return definition
    }

    private getEnumDefinition(clazzType: ts.Type, tc: ts.TypeChecker, definition: Definition): Definition {
        const node = clazzType.getSymbol().getDeclarations()[0]
        const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType)
        const enm = <ts.EnumDeclaration>node

        var enumValues: (number | boolean | string | null)[] = []
        let enumTypes = new Set<string>()

        enm.members.forEach(member => {
            const caseLabel = (<ts.Identifier>member.name).text
            const constantValue = tc.getConstantValue(member)
            if (constantValue !== undefined) {
                enumValues.push(constantValue)
                enumTypes.add(typeof constantValue)
            } else {
                // try to extract the enums value it will probably by a cast expression
                let initial: ts.Expression | undefined = member.initializer
                if (initial) {
                    if ((<any>initial).expression) { // node
                        const exp = (<any>initial).expression
                        const text = (<any>exp).text
                        // if it is an expression with a text literal, chances are it is the enum convension:
                        // CASELABEL = 'literal' as any
                        if (text) {
                            enumValues.push(text)
                            enumTypes.add("string")
                        } else if (exp.kind === ts.SyntaxKind.TrueKeyword || exp.kind === ts.SyntaxKind.FalseKeyword) {
                            enumValues.push((exp.kind === ts.SyntaxKind.TrueKeyword))
                            enumTypes.add("boolean")
                        } else {
                            console.warn("initializer is expression for enum: " + fullName + "." + caseLabel)
                        }
                    } else if (initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText())
                        enumTypes.add("string")
                    } else if (initial.kind === ts.SyntaxKind.NullKeyword) {
                        enumValues.push(null)
                        enumTypes.add("null")
                    }
                }
            }
        })

        if (enumTypes.size) {
            definition.type = (enumTypes.size === 1) ? enumTypes.values().next().value : [...enumTypes]
        }

        if (enumValues.length > 0) {
            definition.enum = enumValues.sort()
        }

        return definition
    }

    private getUnionDefinition(unionType: ts.UnionType, prop: ts.Symbol, tc: ts.TypeChecker, unionModifier: string, definition: Definition) {
        const enumValues = new Set<PrimitiveType>()
        const simpleTypes = new Set<string>()
        const schemas: Definition[] = []

        unionType.types.forEach(valueType => {
            const value = this.extractLiteralValue(valueType)
            if (value !== undefined) {
                enumValues.add(value)
            } else {
                const def = this.getTypeDefinition(valueType, tc)
                if (def.type === "undefined") {
                    if (prop) {
                        (<any>prop).mayBeUndefined = true
                    }
                } else {
                    const keys = Object.keys(def)
                    if (keys.length === 1 && keys[0] === "type") {
                        if (typeof def.type !== "string") {
                            console.error("Expected only a simple type.")
                        } else {
                            simpleTypes.add(def.type)
                        }
                    } else {
                        schemas.push(def)
                    }
                }
            }
        })

        if (enumValues.size > 0) {
            const types = new Set<string>()
            enumValues.forEach(value => types.add(typeof value))

            if (types.size === 1 && enumValues.size === 2 && types.values().next().value === "boolean") {
                // If the values are true and false, just add "boolean" as simple type
                simpleTypes.add("boolean")
            } else {
                const enumSchema: Definition = { enum: [...enumValues].sort() }

                // If all values are of the same primitive type, add a "type" field to the schema
                if (types.size === 1) {
                    enumSchema.type = types.values().next().value
                }

                schemas.push(enumSchema)
            }
        }

        if (simpleTypes.size > 0) {
            schemas.push({ type: simpleTypes.size === 1 ? simpleTypes.values().next().value : [...simpleTypes] })
        }

        if (schemas.length === 1) {
            for (let k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k]
                }
            }
        } else {
            definition[unionModifier] = schemas
        }
        return definition
    }

    private getClassDefinition(clazzType: ts.Type, tc: ts.TypeChecker, definition: Definition): Definition {
        const node = clazzType.getSymbol().getDeclarations()[0]
        if (this.args.useTypeOfKeyword && node.kind === ts.SyntaxKind.FunctionType) {
            definition.typeof = "function"
            return definition
        }

        const clazz = <ts.ClassDeclaration>node
        const props = tc.getPropertiesOfType(clazzType)
        const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType)

        const modifierFlags = ts.getCombinedModifierFlags(node)

        if (props.length === 0 && clazz.members && clazz.members.length === 1 && clazz.members[0].kind === ts.SyntaxKind.IndexSignature) {
            // for case "array-types"
            const indexSignature = <ts.IndexSignatureDeclaration>clazz.members[0]
            if (indexSignature.parameters.length !== 1) {
                throw "Not supported: IndexSignatureDeclaration parameters.length != 1"
            }
            const indexSymbol: ts.Symbol = (<any>indexSignature.parameters[0]).symbol
            const indexType = tc.getTypeOfSymbolAtLocation(indexSymbol, node)
            const isStringIndexed = (indexType.flags === ts.TypeFlags.String)
            if (indexType.flags !== ts.TypeFlags.Number && !isStringIndexed) {
                throw "Not supported: IndexSignatureDeclaration with index symbol other than a number or a string"
            }

            const typ = tc.getTypeAtLocation(indexSignature.type!)
            const def = this.getTypeDefinition(typ, tc, undefined, "anyOf")

            if (isStringIndexed) {
                definition.type = "object"
                definition.additionalProperties = def
            } else {
                definition.type = "array"
                definition.items = def
            }
        } else if (modifierFlags & ts.ModifierFlags.Abstract) {
            const oneOf = this.inheritingTypes[fullName].map((typename) => {
                return this.getTypeDefinition(this.allSymbols[typename], tc)
            })

            definition.oneOf = oneOf
        } else {
            const propertyDefinitions = props.reduce((all, prop) => {
                const propertyName = prop.getName()
                const propDef = this.getDefinitionForProperty(prop, tc, node)
                if (propDef != null) {
                    all[propertyName] = propDef
                }
                return all
            }, {})

            definition.type = "object"
            definition.properties = propertyDefinitions

            if (this.args.useDefaultProperties) {
                definition.defaultProperties = []
            }
            if (this.args.disableExtraProperties && definition.additionalProperties === undefined) {
                definition.additionalProperties = false
            }
            if (this.args.usePropertyOrder) {
                // propertyOrder is non-standard, but useful:
                // https://github.com/json-schema/json-schema/issues/87
                definition.propertyOrder = props.map(prop => prop.getName())
            }
            if (this.args.generateRequired) {
                const requiredProps = props.filter(prop =>
                    !(prop.flags & ts.SymbolFlags.Optional)
                    && !(<any>prop).mayBeUndefined
                    && definition.properties
                    && prop.getName() in definition.properties
                ).map(prop => prop.getName())

                if (requiredProps.length > 0) {
                    definition.required = requiredProps
                }
            }
        }
        return definition
    }

    private simpleTypesAllowedProperties = {
        type: true,
        description: true
    }

    private addSimpleType(def: Definition, type: string) {
        for (let k in def) {
            if (!this.simpleTypesAllowedProperties[k]) {
                return false
            }
        }

        if (!def.type) {
            def.type = type
        } else if (Array.isArray(def.type)) {
            if (!def.type.every((val) => typeof val === "string")) {
                return false
            }

            if (def.type.indexOf("null") === -1) {
                def.type.push("null")
            }
        } else {
            if (typeof def.type !== "string") {
                return false
            }

            if (def.type !== "null") {
                def.type = [def.type, "null"]
            }
        }
        return true
    }

    private makeNullable(def: Definition) {
        if (!this.addSimpleType(def, "null")) {
            let union = def.oneOf || def.anyOf
            if (union) {
                union.push({ type: "null" })
            } else {
                const subdef = {}
                for (var k in def) {
                    if (def.hasOwnProperty(k)) {
                        subdef[k] = def[k]
                        delete def[k]
                    }
                }
                def.anyOf = [subdef, { type: "null" }]
            }
        }
        return def
    }

    private getTypeDefinition(typ: ts.Type, tc: ts.TypeChecker, asRef = this.args.useRef, unionModifier: string = "anyOf", prop?: ts.Symbol, reffedType?: ts.Symbol): Definition {
        const definition: Definition = {} // real definition
        let returnedDefinition = definition // returned definition, may be a $ref

        const symbol = typ.getSymbol()
        const isRawType = (!symbol || symbol.name === "integer" || symbol.name === "Array" || symbol.name === "ReadonlyArray" || symbol.name === "Date")

        // special case: an union where all child are string literals -> make an enum instead
        let isStringEnum = false
        if (typ.flags & ts.TypeFlags.Union) {
            const unionType = <ts.UnionType>typ
            isStringEnum = (unionType.types.every(propType => {
                return (propType.getFlags() & ts.TypeFlags.StringLiteral) !== 0
            }))
        }

        // aliased types must be handled slightly different
        const asTypeAliasRef = asRef && reffedType && (this.args.useTypeAliasRef || isStringEnum)
        if (!asTypeAliasRef) {
            if (isRawType || typ.getFlags() & ts.TypeFlags.Object && (<ts.ObjectType>typ).objectFlags & ts.ObjectFlags.Anonymous) {
                asRef = false  // raw types and inline types cannot be reffed,
                // unless we are handling a type alias
            }
        }

        let fullTypeName = ""
        if (asTypeAliasRef) {
            fullTypeName = tc.getFullyQualifiedName(
                reffedType!.getFlags() & ts.SymbolFlags.Alias ?
                    tc.getAliasedSymbol(reffedType!) :
                    reffedType!
            ).replace(REGEX_FILE_NAME, "")
        } else if (asRef) {
            fullTypeName = tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType)
        }

        if (asRef) {
            returnedDefinition = {
                "$ref": "#/definitions/" + fullTypeName
            }
        }

        // Parse comments
        const otherAnnotations = {}
        this.parseCommentsIntoDefinition(reffedType!, definition, otherAnnotations) // handle comments in the type alias declaration
        if (prop) {
            this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations)
        }
        this.parseCommentsIntoDefinition(symbol, definition, otherAnnotations)

        // Create the actual definition only if is an inline definition, or
        // if it will be a $ref and it is not yet created
        if (!asRef || !this.reffedDefinitions[fullTypeName]) {
            if (asRef) { // must be here to prevent recursivity problems
                this.reffedDefinitions[fullTypeName] = asTypeAliasRef && reffedType!.getFlags() & ts.TypeFlags.IndexedAccess && symbol ? this.getTypeDefinition(typ, tc, true, undefined, symbol, symbol) : definition
                if (this.args.useTitle && fullTypeName) {
                    definition.title = fullTypeName
                }
            }
            const node = symbol && symbol.getDeclarations() !== undefined ? symbol.getDeclarations()[0] : null
            if (node && node.kind === ts.SyntaxKind.MethodDeclaration && this.args.ignoreObjectMethods) {
                definition.ignore = true
                return definition
            }

            if (definition.type === undefined) {  // if users override the type, do not try to infer it
                if (typ.flags & ts.TypeFlags.Union) {
                    this.getUnionDefinition(typ as ts.UnionType, prop!, tc, unionModifier, definition)
                } else if (typ.flags & ts.TypeFlags.Intersection) {
                    definition.allOf = (<ts.IntersectionType>typ).types.map(type => this.getTypeDefinition(type, tc))
                } else if (isRawType) {
                    this.getDefinitionForRootType(typ, tc, reffedType!, definition)
                } else if (node && (node.kind === ts.SyntaxKind.EnumDeclaration || node.kind === ts.SyntaxKind.EnumMember)) {
                    this.getEnumDefinition(typ, tc, definition)
                } else if (symbol && symbol.flags & ts.SymbolFlags.TypeLiteral && Object.keys(symbol.members).length === 0) {
                    // {} is TypeLiteral with no members. Need special case because it doesn't have declarations.
                    definition.type = "object"
                    definition.properties = {}
                } else {
                    this.getClassDefinition(typ, tc, definition)
                }
            }
        }

        if (otherAnnotations["nullable"]) {
            this.makeNullable(returnedDefinition)
        }

        return returnedDefinition
    }

    public setSchemaOverride(symbolName: string, schema: Definition) {
        this.reffedDefinitions[symbolName] = schema
    }

    public getSchemaForSymbol(symbolName: string, includeReffedDefinitions: boolean = true): Definition {
        if (!this.allSymbols[symbolName]) {
            throw `type ${symbolName} not found`
        }
        let def = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.useRootRef)

        if (this.args.useRef && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            def.definitions = this.reffedDefinitions
        }
        def["$schema"] = "http://json-schema.org/draft-04/schema#"
        return def
    }

    public getSchemaForSymbols(symbols: string[]): Definition {
        const root = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            definitions: {}
        }
        symbols.forEach(symbol => root.definitions[symbol] = this.getTypeDefinition(this.userSymbols[symbol], this.tc, this.args.useRootRef))
        return root
    }

    public getUserSymbols() {
        return Object.keys(this.userSymbols)
    }
}

export function getProgramFromFiles(files: string[], compilerOptions: ts.CompilerOptions = {}): ts.Program {
    // use built-in default options
    const options: ts.CompilerOptions = {
        noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    }
    for (const k in compilerOptions) {
        if (compilerOptions.hasOwnProperty(k)) {
            options[k] = compilerOptions[k]
        }
    }
    return ts.createProgram(files, options)
}

export function buildGenerator(program: ts.Program, args: PartialArgs = {}): JsonSchemaGenerator | null {
    // Use defaults unles otherwise specified
    let settings = new Args()

    for (const pref in args) {
        if (args.hasOwnProperty(pref)) {
            settings[pref] = args[pref]
        }
    }

    const typeChecker = program.getTypeChecker()

    var diagnostics = ts.getPreEmitDiagnostics(program)

    if (diagnostics.length === 0 || args.ignoreErrors) {

        const allSymbols: { [name: string]: ts.Type } = {}
        const userSymbols: { [name: string]: ts.Type } = {}
        const inheritingTypes: { [baseName: string]: string[] } = {}

        program.getSourceFiles().forEach((sourceFile, _sourceFileIdx) => {
            function inspect(node: ts.Node, tc: ts.TypeChecker) {

                if (node.kind === ts.SyntaxKind.ClassDeclaration
                    || node.kind === ts.SyntaxKind.InterfaceDeclaration
                    || node.kind === ts.SyntaxKind.EnumDeclaration
                    || node.kind === ts.SyntaxKind.TypeAliasDeclaration
                ) {
                    const symbol: ts.Symbol = (<any>node).symbol
                    let fullName = tc.getFullyQualifiedName(symbol)

                    const nodeType = tc.getTypeAtLocation(node)

                    // remove file name
                    // TODO: we probably don't want this eventually,
                    // as same types can occur in different files and will override eachother in allSymbols
                    // This means atm we can't generate all types in large programs.
                    fullName = fullName.replace(/".*"\./, "")

                    allSymbols[fullName] = nodeType

                    // if (sourceFileIdx == 0)
                    if (!sourceFile.hasNoDefaultLib) {
                        userSymbols[fullName] = nodeType
                    }

                    const baseTypes = nodeType.getBaseTypes() || []

                    baseTypes.forEach(baseType => {
                        var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType)
                        if (!inheritingTypes[baseName]) {
                            inheritingTypes[baseName] = []
                        }
                        inheritingTypes[baseName].push(fullName)
                    })
                } else {
                    ts.forEachChild(node, (n) => inspect(n, tc))
                }
            }
            inspect(sourceFile, typeChecker)
        })

        return new JsonSchemaGenerator(allSymbols, userSymbols, inheritingTypes, typeChecker, settings)
    } else {
        diagnostics.forEach((diagnostic) => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
                console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
            } else {
                console.error(message)
            }
        })
        return null
    }
}

export function generateSchema(program: ts.Program, fullTypeName: string, args: PartialArgs = {}): Definition | null {
    const generator = buildGenerator(program, args)

    if (generator === null) {
        return null
    }

    let definition: Definition
    if (fullTypeName === "*") { // All types in file(s)
        definition = generator.getSchemaForSymbols(generator.getUserSymbols())
    } else { // Use specific type as root object
        definition = generator.getSchemaForSymbol(fullTypeName)
    }
    return definition
}

export function programFromConfig(configFileName: string): ts.Program {
    // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
    const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName))
    const configObject = result.config

    const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, configFileName)
    const options = configParseResult.options
    options.noEmit = true
    delete options.out
    delete options.outDir
    delete options.outFile
    delete options.declaration

    const program = ts.createProgram(configParseResult.fileNames, options)
    return program
}

export function exec(filePattern: string, fullTypeName: string, args = new Args()) {
    let program: ts.Program
    if (path.basename(filePattern) === "tsconfig.json") {
        program = programFromConfig(filePattern)
    } else {
        program = getProgramFromFiles(glob.sync(filePattern), {
            strictNullChecks: args.strictNullChecks
        })
    }

    const definition = generateSchema(program, fullTypeName, args)
    if (definition === null) {
        return
    }

    const json = stringify(definition, { space: 4 }) + "\n\n"
    if (args.out) {
        require("fs").writeFile(args.out, json, function (err: Error) {
            if (err) {
                console.error("Unable to write output file: " + err.message)
            }
        })
    } else {
        process.stdout.write(json)
    }
}

export function run() {
    var helpText = "Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>"
    const scriptArgs = new Args()
    var args = (<Argv>require("yargs"))
        .usage(helpText)
        .demand(2)
        .options({
            useRef: {
                boolean: true,
                default: scriptArgs.useRef,
                description: "Create shared ref definitions."
            },
            useTypeAliasRef: {
                boolean: true,
                default: scriptArgs.useTypeAliasRef,
                description: "Create shared ref definitions for the type aliases."
            },
            useRootRef: {
                boolean: true,
                default: scriptArgs.useRootRef,
                description: "Create a top-level ref definition."
            },
            useTitle: {
                boolean: true,
                default: scriptArgs.useTitle,
                description: "Creates titles in the output schema."
            },
            useDefaultProperties: {
                boolean: true,
                default: scriptArgs.useDefaultProperties,
                description: "Create default properties definitions."
            },
            disableExtraProperties: {
                boolean: true,
                default: scriptArgs.disableExtraProperties,
                description: "Disable additional properties in objects by default."
            },
            usePropertyOrder: {
                boolean: true,
                default: scriptArgs.usePropertyOrder,
                description: "Create property order definitions."
            },
            useTypeOfKeyword: {
                boolean: true,
                default: scriptArgs.useTypeOfKeyword,
                description: "Use typeOf keyword (https://goo.gl/DC6sni) for functions."
            },
            ignoreObjectMethods: {
                boolean: true,
                default: scriptArgs.ignoreObjectMethods,
                description: "Exclude methods from the generated schema"
            },
            generateRequired: {
                boolean: true,
                default: scriptArgs.generateRequired,
                description: "Create required array for non-optional properties."
            },
            strictNullChecks: {
                boolean: true,
                default: scriptArgs.strictNullChecks,
                description: "Make values non-nullable by default."
            },
            ignoreErrors: {
                boolean: true,
                default: scriptArgs.ignoreErrors,
                description: "Generate even if the program has errors."
            },
            validationKeywords: {
                array: true,
                default: scriptArgs.validationKeywords,
                description: "Provide additional validation keywords to include."
            },
            out: {
                alias: "o",
                description: "The output file, defaults to using stdout"
            }
        })
        .argv

    for (let k in scriptArgs) {
        if (args.hasOwnProperty(k)) {
            scriptArgs[k] = args[k]
        }
    }
    exec(args._[0], args._[1], scriptArgs)
}
