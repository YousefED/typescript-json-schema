import * as ts from "typescript";
import * as fs from "fs";
import * as glob from "glob";

var vm = require("vm");

export module TJS {
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

        constructor(allSymbols: { [name: string]: ts.Type }, inheritingTypes: { [baseName: string]: string[] }, tc: ts.TypeChecker, private useRef: boolean = false) {
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

        private getDefinitionForType(propertyType: ts.Type, tc: ts.TypeChecker) {
            if (propertyType.flags & ts.TypeFlags.Union) {
                const unionType = <ts.UnionType>propertyType;
                const oneOf = unionType.types.map((propType) => {
                    return this.getDefinitionForType(propType, tc);
                });

                return {
                    "oneOf": oneOf
                };
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
                    if (propertyType.getSymbol().getName() == "Array") {
                        const arrayType = (<ts.TypeReference>propertyType).typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getDefinitionForType(arrayType, tc);
                    } else {
                        const definition = this.getClassDefinition(propertyType, tc);
                        return definition;
                    }
            }
            return definition;
        }

        private getDefinitionForProperty(prop: ts.Symbol, tc: ts.TypeChecker, node: ts.Node) {
            const propertyName = prop.getName();
            const propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            const propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);



            let definition: any = this.getDefinitionForType(propertyType, tc);
            definition.title = propertyName;

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

        private getClassDefinition(clazzType: ts.Type, tc: ts.TypeChecker, asRef = this.useRef): any {
            const node = clazzType.getSymbol().getDeclarations()[0];
            const clazz = <ts.ClassDeclaration>node;
            const props = tc.getPropertiesOfType(clazzType);
            const fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

            if (clazz.flags & ts.NodeFlags.Abstract) {
                const oneOf = this.inheritingTypes[fullName].map((typename) => {
                    return this.getClassDefinition(this.allSymbols[typename], tc);
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

                const definition = {
                    type: "object",
                    title: fullName,
                    defaultProperties: [], // TODO: set via comment or parameter instead of hardcode here, json-editor specific
                    properties: propertyDefinitions
                };

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
            let def = this.getClassDefinition(this.allSymbols[clazzName], this.tc);

            if (this.useRef && includeReffedDefinitions) {
                def.definitions = this.reffedDefinitions;
            }

            return def;
        }
    }

    export function generateSchema(compileFiles: string[], fullTypeName: string) {
        const options: ts.CompilerOptions = { noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS };
        const program = ts.createProgram(compileFiles, options);
        const tc = program.getTypeChecker();

        var diagnostics = [
            ...program.getGlobalDiagnostics(),
            ...program.getDeclarationDiagnostics(),
            ...program.getSemanticDiagnostics()
        ];


        if (diagnostics.length == 0) {

            const allSymbols: { [name: string]: ts.Type } = {};
            const inheritingTypes: { [baseName: string]: string[] } = {};

            program.getSourceFiles().forEach(sourceFile => {
                function inspect(node: ts.Node, tc: ts.TypeChecker) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration || node.kind == ts.SyntaxKind.InterfaceDeclaration) {
                        const nodeType = tc.getTypeAtLocation(node);
                        const fullName = tc.typeToString(nodeType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        allSymbols[fullName] = nodeType;
                        nodeType.getBaseTypes().forEach(baseType => {
                            const baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
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

            const useRef = true;
            const generator = new JsonSchemaGenerator(allSymbols, inheritingTypes, tc, useRef);
            const definition = generator.getClassDefinitionByName(fullTypeName);
            return definition;
        } else {
            diagnostics.forEach((diagnostic) => console.warn(diagnostic.messageText + " " + diagnostic.file.fileName + " " + diagnostic.start));
        }
    }

    export function exec(filePattern: string, fullTypeName: string) {
        const files: string[] = glob.sync(filePattern);
        const definition = TJS.generateSchema(files, fullTypeName);
        console.log(JSON.stringify(definition, null, 4));
        //fs.writeFile(outFile, JSON.stringify(definition, null, 4));
    }
}

if (typeof window === "undefined" && require.main === module) {

    if (process.argv[3]) {
        TJS.exec(process.argv[2], process.argv[3]);
    } else {
        console.log("Usage: node typescript-json-schema.js <path-to-typescript-files> <type>\n");
    }
}

//TJS.exec("example/**/*.ts", "Invoice");
//node typescript-json-schema.js example/**/*.ts Invoice
//debugger;