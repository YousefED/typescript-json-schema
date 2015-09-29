/// <reference path="typings/typescript/typescript.d.ts" />
/// <reference path="typings/glob/glob.d.ts" />


declare var require: any;
import * as ts from "typescript";
import {readFileSync} from "fs";
import * as glob from "glob";
//import JsonSchemaGenerator = require("./jsonschemagenerator");

module TJS {
    class JsonSchemaGenerator {
        private validationKeywords = ["ignore", "description", "type", "minimum", "exclusiveMinimum", "maximum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "format", "pattern", "minItems", "maxItems", "uniqueItems", "default", "additionalProperties"];
        private annotedValidationKeywordPattern = /@[a-z.-]+\s*[^@\s]+/gi;
        //private static primitiveTypes = ["string", "number", "boolean", "any"];

        /**
         * (source: Typson)
         * Extracts the schema validation keywords stored in a comment and register them as properties.
         * A validation keyword starts by a @. It has a name and a value. Several keywords may occur.
         *
         * @param comment {string} the full comment.
         * @param to {object} the destination variable.
         */
        private copyValidationKeywords(comment, to) {
            this.annotedValidationKeywordPattern.lastIndex = 0;
            // TODO: to improve the use of the exec method: it could make the tokenization
            var annotation;
            while ((annotation = this.annotedValidationKeywordPattern.exec(comment))) {
                var annotationTokens = annotation[0].split(" ");
                var keyword: string = annotationTokens[0].slice(1);
                var path = keyword.split(".");
                var context = null;

                // TODO: paths etc. originate from Typson, not supported atm.
                if (path.length > 1) {
                    context = path[0];
                    keyword = path[1];
                }

                keyword = keyword.replace("TJS-", "");

                // case sensitive check inside the dictionary
                if (this.validationKeywords.indexOf(keyword) >= 0 || this.validationKeywords.indexOf("TJS-" + keyword) >= 0) {
                    var value = annotationTokens.length > 1 ? annotationTokens[1] : "";
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                    }
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
        private copyDescription(comment, to) {
            var delimiter = "@";
            var delimiterIndex = comment.indexOf(delimiter);
            var description = comment.slice(0, delimiterIndex < 0 ? comment.length : delimiterIndex);
            if (description.length > 0) {
                to.description = description.replace(/\s+$/g, "");
            }
            return delimiterIndex < 0 ? "" : comment.slice(delimiterIndex);
        }

        private parseCommentsIntoDefinition(comments: ts.SymbolDisplayPart[], definition: any): void {
            if (!comments || !comments.length) {
                return;
            }
            var joined = comments.map(comment => comment.text.trim()).join("\n");
            joined = this.copyDescription(joined, definition);
            this.copyValidationKeywords(joined, definition);
        }

        private getDefinitionForType(propertyType: ts.Type, tc: ts.TypeChecker) {

            let propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);

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
                        let arrayType = (<ts.TypeReference>propertyType).typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getDefinitionForType(arrayType, tc);
                    } else {
                        let definition = this.getClassDefinition(propertyType, tc);
                        return definition;
                    }
            }
            return definition;
        }

        private getDefinitionForProperty(prop: ts.Symbol, tc: ts.TypeChecker, node: ts.Node) {
            let propertyName = prop.getName();
            let propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            let propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);



            let definition: any = this.getDefinitionForType(propertyType, tc);
            definition.title = propertyName;

            let comments = prop.getDocumentationComment();
            this.parseCommentsIntoDefinition(comments, definition);

            if (definition.hasOwnProperty("ignore")) {
                return null;
            }
            
            //for (var k in extraInfo) definition[k] = extraInfo[k];

            return definition;
        }

        public getClassDefinition(clazzType: ts.Type, tc: ts.TypeChecker) {
            let node = clazzType.getSymbol().getDeclarations()[0];
            let clazz = <ts.ClassDeclaration>node;
            let props = tc.getPropertiesOfType(clazzType);

            let propertyDefinitions = props.reduce((all, prop) => {
                let propertyName = prop.getName();
                let definition = this.getDefinitionForProperty(prop, tc, node);
                if (definition != null) {
                    all[propertyName] = definition;
                }
                return all;
            }, {});

            let definition = {
                "type": "object",
                "defaultProperties": [], // TODO: set via comment instead of hardcode here, json-editor specific
                properties: propertyDefinitions
            };
            return definition;
        }
    }



    export function generateSchema(compileFiles: string[], fullTypeName: string) {
        let options: ts.CompilerOptions = { noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5 };
        let program = ts.createProgram(files, options);
        let tc = program.getTypeChecker();

        var diagnostics = [
            ...program.getGlobalDiagnostics(),
            ...program.getDeclarationDiagnostics(),
            ...program.getSemanticDiagnostics()
        ];


        if (diagnostics.length == 0) {

            let allSymbols: { [name: string]: ts.Type } = {};

            program.getSourceFiles().forEach(sourceFile => {
                function inspect(node: ts.Node, tc: ts.TypeChecker) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration) {
                        let clazz = <ts.ClassDeclaration>node;
                        let clazzType = tc.getTypeAtLocation(clazz);
                        //console.log(clazzType.getSymbol().name);
                        let fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        allSymbols[fullName] = clazzType;
                    } else {
                        ts.forEachChild(node, (node) => inspect(node, tc));
                    }
                }
                inspect(sourceFile, tc);
            });

            let clazztype = allSymbols[fullTypeName];
            let generator = new JsonSchemaGenerator();
            let definition = generator.getClassDefinition(clazztype, tc);
            return definition;
        } else {
            diagnostics.forEach((diagnostic) => console.warn(diagnostic.messageText + " " + diagnostic.file.fileName + " " + diagnostic.start));
        }
        debugger;

    }
}

var files: string[] = glob.sync("C:/Users/Yousef/Documents/Programming/tweetbeam-client/Beam/**/*.ts");
var fullTypeName = "beam.ViewSettings";

let definition = TJS.generateSchema(files, fullTypeName);

console.log(JSON.stringify(definition));
debugger;