import * as ts from "typescript";
import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";


const vm = require("vm");

export module TJS {
    export const defaultArgs = {
        useRef: true,
        useRootRef: false,
        useTitle: false,
        useDefaultProperties: false,
        usePropertyOrder: false
    };

    class JsonSchemaGenerator {
        private static validationKeywords = [
            "ignore", "description", "type", "minimum", "exclusiveMinimum", "maximum",
            "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "format",
            "pattern", "minItems", "maxItems", "uniqueItems", "default",
            "additionalProperties", "enum"];

        private static annotedValidationKeywordPattern = /@[a-z.-]+\s*[^@]+/gi;
        //private static primitiveTypes = ["string", "number", "boolean", "any"];

        private allSymbols: { [name: string]: ts.Type };
        private inheritingTypes: { [baseName: string]: string[] };
        private tc: ts.TypeChecker;

        private sandbox = { sandboxvar: null };

        private reffedDefinitions: { [key: string]: any } = {};

        constructor(allSymbols: { [name: string]: ts.Type }, inheritingTypes: { [baseName: string]: string[] }, tc: ts.TypeChecker, private args = defaultArgs) {
            this.allSymbols = allSymbols;
            this.inheritingTypes = inheritingTypes;
            this.tc = tc;
        }

        public get ReffedDefinitions(): { [key: string]: any } {
            return this.reffedDefinitions;
        }
        /**
         * (source: Typson)
         * Extracts the schema validation keywords stored in a comment and register them as properties.
         * A validation keyword starts by a @. It has a name and a value. Several keywords may occur.
         *
         * @param comment {string} the full comment.
         * @param to {object} the destination variable.
         */
        private copyValidationKeywords(comment: string, to) {
            JsonSchemaGenerator.annotedValidationKeywordPattern.lastIndex = 0;
            // TODO: to improve the use of the exec method: it could make the tokenization
            let annotation;
            while ((annotation = JsonSchemaGenerator.annotedValidationKeywordPattern.exec(comment))) {
                const annotationTokens = annotation[0].split(" ");
                let keyword: string = annotationTokens[0].slice(1);
                const path = keyword.split(".");
                let context = null;

                // TODO: paths etc. originate from Typson, not supported atm.
                if (path.length > 1) {
                    context = path[0];
                    keyword = path[1];
                }

                keyword = keyword.replace("TJS-", "");

                // case sensitive check inside the dictionary
                if (JsonSchemaGenerator.validationKeywords.indexOf(keyword) >= 0 || JsonSchemaGenerator.validationKeywords.indexOf("TJS-" + keyword) >= 0) {
                    let value: string = annotationTokens.length > 1 ? annotationTokens.slice(1).join(" ") : "";
                    value = value.replace(/^\s+|\s+$/gm, "");  // trim all whitepsace characters, including newlines
                    try {
                        value = JSON.parse(value);
                    } catch (e) { }
                    if (context) {
                        if (!to[context]) {
                            to[context] = {};
                        }
                        to[context][keyword] = value;
                    }
                    else {
                        to[keyword] = value;
                    }
                }
            }
        }

        /**
         * (source: Typson)
         * Extracts the description part of a comment and register it in the description property.
         * The description is supposed to start at first position and may be delimited by @.
         *
         * @param comment {string} the full comment.
         * @param to {object} the destination variable or definition.
         * @returns {string} the full comment minus the beginning description part.
         */
        private copyDescription(comment: string, to): string {
            const delimiter = "@";
            const delimiterIndex = comment.indexOf(delimiter);
            const description = comment.slice(0, delimiterIndex < 0 ? comment.length : delimiterIndex);
            if (description.length > 0) {
                to.description = description.replace(/\s+$/g, "");
            }
            return delimiterIndex < 0 ? "" : comment.slice(delimiterIndex);
        }

        private parseCommentsIntoDefinition(comments: ts.SymbolDisplayPart[], definition: any): void {
            if (!comments || !comments.length) {
                return;
            }
            let joined = comments.map(comment => comment.text.trim()).join("\n");
            joined = this.copyDescription(joined, definition);
            this.copyValidationKeywords(joined, definition);
        }

        private getDefinitionForType(propertyType: ts.Type, tc: ts.TypeChecker, unionModifier: string = "oneOf") {
            if (propertyType.flags & ts.TypeFlags.Union) {
                const unionType = <ts.UnionType>propertyType;
                const types = unionType.types.map((propType) => {
                    return this.getDefinitionForType(propType, tc);
                });
                let definition = {};
                definition[unionModifier] = types;
                return definition;
            }

            const propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

            let definition: any = {
            };

            switch (propertyTypeString.toLowerCase()) {
                case "string":
                    definition.type = "string";
                    break;
                case "number":
                    definition.type = "number";
                    break;
                case "boolean":
                    definition.type = "boolean";
                    break;
                case "any":
                    definition.type = "object";
                    break;
                default:
                    if(propertyType.flags & ts.TypeFlags.Tuple) { // tuple
                        const tupleType: ts.TupleType = <ts.TupleType>propertyType;
                        const fixedTypes = tupleType.elementTypes.map(elType => this.getDefinitionForType(elType, tc));
                        definition.type = "array";
                        definition.items = fixedTypes;
                        definition.minItems = fixedTypes.length;
                        definition.additionalItems = {
                            "anyOf": fixedTypes
                        };
                    } else if (propertyType.getSymbol().getName() == "Array") {
                        const arrayType = (<ts.TypeReference>propertyType).typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getDefinitionForType(arrayType, tc);
                    } else {
                        definition = this.getTypeDefinition(propertyType, tc);
                    }
            }
            return definition;
        }

        private getDefinitionForProperty(prop: ts.Symbol, tc: ts.TypeChecker, node: ts.Node) {
            const propertyName = prop.getName();
            const propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            const propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);



            let definition: any = this.getDefinitionForType(propertyType, tc);
            if (this.args.useTitle) {
                definition.title = propertyName;
            }

            const comments = prop.getDocumentationComment();
            this.parseCommentsIntoDefinition(comments, definition);

            if (definition.hasOwnProperty("ignore")) {
                return null;
            }

            // try to get default value
            let initial = (<ts.VariableDeclaration>prop.valueDeclaration).initializer;

            if (initial) {
                if ((<any>initial).expression) { // node
                    console.warn("initializer is expression for property " + propertyName);
                } else if ((<any>initial).kind && (<any>initial).kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                    definition.default = initial.getText();
                } else {
                    try {
                        const sandbox = { sandboxvar: null };
                        vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);

                        initial = sandbox.sandboxvar;
                        if (initial == null) {

                        } else if (typeof (initial) === "string" || typeof (initial) === "number" || typeof (initial) === "boolean" || Object.prototype.toString.call(initial) === '[object Array]') {
                            definition.default = initial;
                        } else {
                            console.warn("unknown initializer for property " + propertyName + ": " + initial);
                        }
                    } catch (e) {
                        console.warn("exception evaluating initializer for property " + propertyName);
                    }
                }
            }

            return definition;
        }

        private getTypeDefinition(typ: ts.Type, tc: ts.TypeChecker, asRef = this.args.useRef): any {
            if(!typ.getSymbol()) {
                return this.getDefinitionForType(typ, tc);
            }
            const node = typ.getSymbol().getDeclarations()[0];
            if (node.kind == ts.SyntaxKind.EnumDeclaration) {
                return this.getEnumDefinition(typ, tc, asRef);
            } else {
                return this.getClassDefinition(typ, tc, asRef);
            }
        }

        private getEnumDefinition(clazzType: ts.Type, tc: ts.TypeChecker, asRef = this.args.useRef): any {
            const node = clazzType.getSymbol().getDeclarations()[0];
            const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            const enm = <ts.EnumDeclaration>node;
            const values = tc.getIndexTypeOfType(clazzType, ts.IndexKind.String);

            var enumValues: string[] = [];

            enm.members.forEach(member => {
                const caseLabel = (<ts.Identifier>member.name).text;

                // try to extract the enums value; it will probably by a cast expression
                let initial = <ts.Expression>member.initializer;

                if (initial) {
                    if ((<any>initial).expression) { // node
                        const exp = (<any>initial).expression;
                        const text = (<any>exp).text;
                        // if it is an expression with a text literal, chances are it is the enum convension:
                        // CASELABEL = 'literal' as any
                        if (text) {
                            enumValues.push(text);
                        } else {
                            console.warn("initializer is expression for enum: " + fullName + "." + caseLabel);
                        }
                    } else if ((<any>initial).kind && (<any>initial).kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText());
                    }
                }
            });

            var definition = {
                type: "string",
                title: fullName
            };

            if (enumValues.length > 0) {
                definition["enum"] = enumValues;
            }

            if (asRef) {
                this.reffedDefinitions[fullName] = definition;
                return {
                    "$ref": "#/definitions/" + fullName
                };
            } else {
                return definition;
            }
        }

        private getClassDefinition(clazzType: ts.Type, tc: ts.TypeChecker, asRef = this.args.useRef): any {
            const node = clazzType.getSymbol().getDeclarations()[0];
            const clazz = <ts.ClassDeclaration>node;
            const props = tc.getPropertiesOfType(clazzType);
            const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

            if(props.length == 0 && clazz.members.length == 1 && clazz.members[0].kind == ts.SyntaxKind.IndexSignature) {
                // for case "array-types"
                const indexSignature = <ts.IndexSignatureDeclaration>clazz.members[0];
                if(indexSignature.parameters.length != 1) {
                    throw "Not supported: IndexSignatureDeclaration parameters.length != 1"
                }
                const indexSymbol: ts.Symbol = (<any>indexSignature.parameters[0]).symbol;
                const indexType = tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                if(indexType.flags != ts.TypeFlags.Number) {
                    throw "Not supported: IndexSignatureDeclaration with non-number index symbol";
                }
                
                const typ = tc.getTypeAtLocation(indexSignature.type);
                const def = this.getDefinitionForType(typ, tc, "anyOf");

                const definition: any = {
                    type: "array",
                    items: def
                };
                   
                return definition;
            } else if (clazz.flags & ts.NodeFlags.Abstract) {
                const oneOf = this.inheritingTypes[fullName].map((typename) => {
                    return this.getTypeDefinition(this.allSymbols[typename], tc);
                });

                const definition = {
                    "oneOf": oneOf
                };

                return definition;
            } else {
                const propertyDefinitions = props.reduce((all, prop) => {
                    const propertyName = prop.getName();
                    const definition = this.getDefinitionForProperty(prop, tc, node);
                    if (definition != null) {
                        all[propertyName] = definition;
                    }
                    return all;
                }, {});

                // propertyOrder is non-standard, but useful:
                // https://github.com/json-schema/json-schema/issues/87
                const propertyOrder = props.reduce((order, prop) => {
                    order.push(prop.getName());
                    return order;
                }, []);

                let definition: any = {
                    type: "object",
                    properties: propertyDefinitions
                };

                if (this.args.useTitle) {
                    definition.title = fullName;
                }
                if (this.args.useDefaultProperties) {
                    definition.defaultProperties = [];
                }
                if (this.args.usePropertyOrder) {
                    definition.propertyOrder = propertyOrder;
                }

                if (asRef) {
                    this.reffedDefinitions[fullName] = definition;
                    return {
                        "$ref": "#/definitions/" + fullName
                    };
                } else {
                    return definition;
                }
            }
        }

        public getClassDefinitionByName(clazzName: string, includeReffedDefinitions: boolean = true): any {
            if(!this.allSymbols[clazzName]) {
                throw `type {clazzName} not found`;
            }
            let def = this.getTypeDefinition(this.allSymbols[clazzName], this.tc, this.args.useRootRef);

            if (this.args.useRef && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
                def.definitions = this.reffedDefinitions;
            }

            return def;
        }
    }

    export function getProgramFromFiles(files: string[]): ts.Program {  
        // use built-in default options
        const options: ts.CompilerOptions = { 
            noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        };
        return ts.createProgram(files, options); 
    }
    
    export function generateSchema(program: ts.Program, fullTypeName: string, args = defaultArgs) {
        const tc = program.getTypeChecker();

        var diagnostics = ts.getPreEmitDiagnostics(program);

        if (diagnostics.length == 0) {

            const allSymbols: { [name: string]: ts.Type } = {};
            const inheritingTypes: { [baseName: string]: string[] } = {};

            program.getSourceFiles().forEach(sourceFile => {    
                /*console.log(sourceFile.fileName);    
                if(sourceFile.fileName.indexOf("main.ts") > -1) {
                    debugger;
                } */          
                function inspect(node: ts.Node, tc: ts.TypeChecker) {
                    
                    if (node.kind == ts.SyntaxKind.ClassDeclaration
                        || node.kind == ts.SyntaxKind.InterfaceDeclaration
                        || node.kind == ts.SyntaxKind.EnumDeclaration
                        || node.kind == ts.SyntaxKind.TypeAliasDeclaration
                        ) {
                        const nodeType = tc.getTypeAtLocation(node);
                        const fullName = tc.getFullyQualifiedName((<any>node).symbol)
                        allSymbols[fullName] = nodeType;
                        
                        const baseTypes = nodeType.getBaseTypes() || [];
                        
                        baseTypes.forEach(baseType => {
                            var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                            if (!inheritingTypes[baseName]) {
                                inheritingTypes[baseName] = [];
                            }
                            inheritingTypes[baseName].push(fullName);
                        });
                    } else {
                        ts.forEachChild(node, (node) => inspect(node, tc));
                    }
                }
                inspect(sourceFile, tc);
            });

            const generator = new JsonSchemaGenerator(allSymbols, inheritingTypes, tc, args);
            let definition = generator.getClassDefinitionByName(fullTypeName);
            definition["$schema"] = "http://json-schema.org/draft-04/schema#";
            return definition;
        } else {
          diagnostics.forEach((diagnostic) => {
              let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
              if(diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                console.warn(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
              } else {
                  console.warn(message);
              }
          });
        }
    }

    export function programFromConfig(configFileName: string) {
        // basically a copy of https://github.com/Microsoft/TypeScript/blob/3663d400270ccae8b69cbeeded8ffdc8fa12d7ad/src/compiler/tsc.ts -> parseConfigFile
        const result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName));
        const configObject = result.config;
        
        const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, configFileName);
        const options = configParseResult.options;
        options.noEmit = true;
     
        const program = ts.createProgram(configParseResult.fileNames, options);
        return program;
        
        //const conf = ts.convertCompilerOptionsFromJson(null, path.dirname(filePattern), "tsconfig.json");
    }
    export function exec(filePattern: string, fullTypeName: string, args = defaultArgs) {
        let program: ts.Program;
        if(path.basename(filePattern) == "tsconfig.json") {
            program = programFromConfig(filePattern);
        } else {
            program = TJS.getProgramFromFiles(glob.sync(filePattern));
        }
        
        const definition = TJS.generateSchema(program, fullTypeName, args);
        process.stdout.write(JSON.stringify(definition, null, 4) + "\n");
    }

    export function run() {
        var helpText = "Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>";

        var args = require("yargs")
            .usage(helpText)
            .demand(2)
            .boolean("refs").default("refs", defaultArgs.useRef)
                .describe("refs", "Create shared ref definitions.")
            .boolean("topRef").default("topRef", defaultArgs.useRootRef)
                .describe("topRef", "Create a top-level ref definition.")
            .boolean("titles").default("titles", defaultArgs.useTitle)
                .describe("titles", "Creates titles in the output schema.")
            .boolean("defaultProps").default("defaultProps", defaultArgs.useDefaultProperties)
            .describe("defaultProps", "Create default properties definitions.")
            .boolean("propOrder").default("propOrder", defaultArgs.usePropertyOrder)
                .describe("propOrder", "Create property order definitions.")
            .argv;

        exec(args._[0], args._[1], {
            useRef: args.refs,
            useRootRef: args.topRef,
            useTitle: args.titles,
            useDefaultProperties: args.defaultProps,
            usePropertyOrder: args.propOrder
        });
    }
}

if (typeof window === "undefined" && require.main === module) {
    TJS.run();
}

//TJS.exec("example/**/*.ts", "Invoice");
//const result = TJS.generateSchema(TJS.getProgramFromFiles(["test/programs/array-types/main.ts"]), "MyArray");
//console.log(JSON.stringify(result));