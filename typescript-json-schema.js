"use strict";
var ts = require("typescript");
var glob = require("glob");
var path = require("path");
var vm = require("vm");
var TJS;
(function (TJS) {
    function getDefaultArgs() {
        return {
            useRef: true,
            useTypeAliasRef: false,
            useRootRef: false,
            useTitle: false,
            useDefaultProperties: false,
            disableExtraProperties: false,
            usePropertyOrder: false,
            generateRequired: false,
            out: undefined
        };
    }
    TJS.getDefaultArgs = getDefaultArgs;
    var JsonSchemaGenerator = (function () {
        function JsonSchemaGenerator(allSymbols, inheritingTypes, tc, args) {
            if (args === void 0) { args = getDefaultArgs(); }
            this.args = args;
            this.sandbox = { sandboxvar: null };
            this.reffedDefinitions = {};
            this.allSymbols = allSymbols;
            this.inheritingTypes = inheritingTypes;
            this.tc = tc;
        }
        Object.defineProperty(JsonSchemaGenerator.prototype, "ReffedDefinitions", {
            get: function () {
                return this.reffedDefinitions;
            },
            enumerable: true,
            configurable: true
        });
        JsonSchemaGenerator.prototype.copyValidationKeywords = function (comment, to) {
            JsonSchemaGenerator.annotedValidationKeywordPattern.lastIndex = 0;
            var annotation;
            while ((annotation = JsonSchemaGenerator.annotedValidationKeywordPattern.exec(comment))) {
                var annotationTokens = annotation[0].split(" ");
                var keyword = annotationTokens[0].slice(1);
                var path_1 = keyword.split(".");
                var context_1 = null;
                if (path_1.length > 1) {
                    context_1 = path_1[0];
                    keyword = path_1[1];
                }
                keyword = keyword.replace("TJS-", "");
                if (JsonSchemaGenerator.validationKeywords.indexOf(keyword) >= 0 || JsonSchemaGenerator.validationKeywords.indexOf("TJS-" + keyword) >= 0) {
                    var value = annotationTokens.length > 1 ? annotationTokens.slice(1).join(" ") : "";
                    value = value.replace(/^\s+|\s+$/gm, "");
                    try {
                        value = JSON.parse(value);
                    }
                    catch (e) { }
                    if (context_1) {
                        if (!to[context_1]) {
                            to[context_1] = {};
                        }
                        to[context_1][keyword] = value;
                    }
                    else {
                        to[keyword] = value;
                    }
                }
            }
        };
        JsonSchemaGenerator.prototype.copyDescription = function (comment, to) {
            var delimiter = "@";
            var delimiterIndex = comment.indexOf(delimiter);
            var description = comment.slice(0, delimiterIndex < 0 ? comment.length : delimiterIndex);
            if (description.length > 0) {
                to.description = description.replace(/\s+$/g, "");
            }
            return delimiterIndex < 0 ? "" : comment.slice(delimiterIndex);
        };
        JsonSchemaGenerator.prototype.parseCommentsIntoDefinition = function (symbol, definition) {
            if (!symbol) {
                return;
            }
            var comments = symbol.getDocumentationComment();
            if (!comments || !comments.length) {
                return;
            }
            var joined = comments.map(function (comment) { return comment.text.trim(); }).join("\n");
            joined = this.copyDescription(joined, definition);
            this.copyValidationKeywords(joined, definition);
        };
        JsonSchemaGenerator.prototype.getDefinitionForRootType = function (propertyType, tc, reffedType, definition) {
            var _this = this;
            var symbol = propertyType.getSymbol();
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            switch (propertyTypeString.toLowerCase()) {
                case "string":
                    definition.type = "string";
                    break;
                case "number":
                    var isInteger = (definition.type == "integer" || (reffedType && reffedType.getName() == "integer"));
                    definition.type = isInteger ? "integer" : "number";
                    break;
                case "boolean":
                    definition.type = "boolean";
                    break;
                case "any":
                    break;
                case "date":
                    definition.type = "string";
                    definition.format = "date-time";
                    break;
                default:
                    if (propertyType.flags & ts.TypeFlags.Tuple) {
                        var tupleType = propertyType;
                        var fixedTypes = tupleType.elementTypes.map(function (elType) { return _this.getTypeDefinition(elType, tc); });
                        definition.type = "array";
                        definition.items = fixedTypes;
                        definition.minItems = fixedTypes.length;
                        definition.additionalItems = {
                            "anyOf": fixedTypes
                        };
                    }
                    else if (propertyType.flags & ts.TypeFlags.StringLiteral) {
                        definition.type = "string";
                        definition.enum = [propertyType.text];
                    }
                    else if (symbol && symbol.getName() == "Array") {
                        var arrayType = propertyType.typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getTypeDefinition(arrayType, tc);
                    }
                    else {
                        console.error("Unsupported type: ", propertyType);
                    }
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getReferencedTypeSymbol = function (prop, tc) {
            var decl = prop.getDeclarations();
            if (decl && decl.length) {
                var type = decl[0].type;
                if (type && (type.kind & ts.SyntaxKind.TypeReference) && type.typeName) {
                    return tc.getSymbolAtLocation(type.typeName);
                }
            }
            return null;
        };
        JsonSchemaGenerator.prototype.getDefinitionForProperty = function (prop, tc, node) {
            var propertyName = prop.getName();
            var propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var reffedType = this.getReferencedTypeSymbol(prop, tc);
            var definition = this.getTypeDefinition(propertyType, tc, undefined, undefined, prop, reffedType);
            if (this.args.useTitle) {
                definition.title = propertyName;
            }
            if (definition.hasOwnProperty("ignore")) {
                return null;
            }
            var initial = prop.valueDeclaration.initializer;
            if (initial) {
                if (initial.expression) {
                    console.warn("initializer is expression for property " + propertyName);
                }
                else if (initial.kind && initial.kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                    definition.default = initial.getText();
                }
                else {
                    try {
                        var sandbox = { sandboxvar: null };
                        vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);
                        initial = sandbox.sandboxvar;
                        if (initial === null || typeof (initial) === "string" || typeof (initial) === "number" || typeof (initial) === "boolean" || Object.prototype.toString.call(initial) === '[object Array]') {
                            definition.default = initial;
                        }
                        else if (initial) {
                            console.warn("unknown initializer for property " + propertyName + ": " + initial);
                        }
                    }
                    catch (e) {
                        console.warn("exception evaluating initializer for property " + propertyName);
                    }
                }
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getEnumDefinition = function (clazzType, tc, definition) {
            var node = clazzType.getSymbol().getDeclarations()[0];
            var fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var enm = node;
            var values = tc.getIndexTypeOfType(clazzType, ts.IndexKind.String);
            var enumValues = [];
            enm.members.forEach(function (member) {
                var caseLabel = member.name.text;
                var initial = member.initializer;
                if (initial) {
                    if (initial.expression) {
                        var exp = initial.expression;
                        var text = exp.text;
                        if (text) {
                            enumValues.push(text);
                        }
                        else {
                            console.warn("initializer is expression for enum: " + fullName + "." + caseLabel);
                        }
                    }
                    else if (initial.kind && initial.kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText());
                    }
                }
            });
            definition.type = "string";
            if (enumValues.length > 0) {
                definition["enum"] = enumValues;
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getClassDefinition = function (clazzType, tc, definition) {
            var _this = this;
            var node = clazzType.getSymbol().getDeclarations()[0];
            var clazz = node;
            var props = tc.getPropertiesOfType(clazzType);
            var fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            if (props.length == 0 && clazz.members && clazz.members.length == 1 && clazz.members[0].kind == ts.SyntaxKind.IndexSignature) {
                var indexSignature = clazz.members[0];
                if (indexSignature.parameters.length != 1) {
                    throw "Not supported: IndexSignatureDeclaration parameters.length != 1";
                }
                var indexSymbol = indexSignature.parameters[0].symbol;
                var indexType = tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                var isStringIndexed = (indexType.flags == ts.TypeFlags.String);
                if (indexType.flags != ts.TypeFlags.Number && !isStringIndexed) {
                    throw "Not supported: IndexSignatureDeclaration with index symbol other than a number or a string";
                }
                var typ = tc.getTypeAtLocation(indexSignature.type);
                var def = this.getTypeDefinition(typ, tc, undefined, "anyOf");
                if (isStringIndexed) {
                    definition.type = "object";
                    definition.additionalProperties = def;
                }
                else {
                    definition.type = "array";
                    definition.items = def;
                }
                return definition;
            }
            else if (clazz.flags & ts.NodeFlags.Abstract) {
                var oneOf = this.inheritingTypes[fullName].map(function (typename) {
                    return _this.getTypeDefinition(_this.allSymbols[typename], tc);
                });
                definition.oneOf = oneOf;
                return definition;
            }
            else {
                var propertyDefinitions = props.reduce(function (all, prop) {
                    var propertyName = prop.getName();
                    var propDef = _this.getDefinitionForProperty(prop, tc, node);
                    if (propDef != null) {
                        all[propertyName] = propDef;
                    }
                    return all;
                }, {});
                definition.type = "object";
                definition.properties = propertyDefinitions;
                if (this.args.useDefaultProperties) {
                    definition.defaultProperties = [];
                }
                if (this.args.disableExtraProperties && definition.additionalProperties === undefined) {
                    definition.additionalProperties = false;
                }
                if (this.args.usePropertyOrder) {
                    var propertyOrder = props.reduce(function (order, prop) {
                        order.push(prop.getName());
                        return order;
                    }, []);
                    definition.propertyOrder = propertyOrder;
                }
                if (this.args.generateRequired) {
                    var requiredProps = props.reduce(function (required, prop) {
                        if (!(prop.flags & ts.SymbolFlags.Optional)) {
                            required.push(prop.getName());
                        }
                        return required;
                    }, []);
                    if (requiredProps.length > 0) {
                        definition.required = requiredProps;
                    }
                }
            }
        };
        JsonSchemaGenerator.prototype.getTypeDefinition = function (typ, tc, asRef, unionModifier, prop, reffedType) {
            var _this = this;
            if (asRef === void 0) { asRef = this.args.useRef; }
            if (unionModifier === void 0) { unionModifier = "oneOf"; }
            var definition = {};
            var returnedDefinition = definition;
            var symbol = typ.getSymbol();
            var isRawType = (!symbol || symbol.name == "integer" || symbol.name == "Array" || symbol.name == "Date");
            var isStringEnum = false;
            if (typ.flags & ts.TypeFlags.Union) {
                var unionType = typ;
                isStringEnum = (unionType.types.every(function (propType, i, r) {
                    return (propType.getFlags() & ts.TypeFlags.StringLiteral) != 0;
                }));
            }
            var asTypeAliasRef = asRef && reffedType && (this.args.useTypeAliasRef || isStringEnum);
            if (!asTypeAliasRef) {
                if (isRawType || (typ.getFlags() & ts.TypeFlags.Anonymous)) {
                    asRef = false;
                }
            }
            var fullTypeName = "";
            if (asTypeAliasRef) {
                fullTypeName = tc.getFullyQualifiedName(reffedType);
            }
            else if (asRef) {
                fullTypeName = tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            }
            if (asRef) {
                returnedDefinition = {
                    "$ref": "#/definitions/" + fullTypeName
                };
            }
            this.parseCommentsIntoDefinition(reffedType, definition);
            this.parseCommentsIntoDefinition(prop || symbol, returnedDefinition);
            if (!asRef || !this.reffedDefinitions[fullTypeName]) {
                if (asRef) {
                    this.reffedDefinitions[fullTypeName] = definition;
                    if (this.args.useTitle && fullTypeName) {
                        definition.title = fullTypeName;
                    }
                }
                var node = symbol ? symbol.getDeclarations()[0] : null;
                if (typ.flags & ts.TypeFlags.Union) {
                    var unionType = typ;
                    if (isStringEnum) {
                        definition.type = "string";
                        definition.enum = unionType.types.map(function (propType) {
                            return propType.text;
                        });
                    }
                    else {
                        definition[unionModifier] = unionType.types.map(function (propType) {
                            return _this.getTypeDefinition(propType, tc);
                        });
                    }
                }
                else if (isRawType) {
                    this.getDefinitionForRootType(typ, tc, reffedType, definition);
                }
                else if (node.kind == ts.SyntaxKind.EnumDeclaration) {
                    this.getEnumDefinition(typ, tc, definition);
                }
                else {
                    this.getClassDefinition(typ, tc, definition);
                }
            }
            return returnedDefinition;
        };
        JsonSchemaGenerator.prototype.getSchemaForSymbol = function (symbolName, includeReffedDefinitions) {
            if (includeReffedDefinitions === void 0) { includeReffedDefinitions = true; }
            if (!this.allSymbols[symbolName]) {
                throw "type " + symbolName + " not found";
            }
            var def = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.useRootRef);
            if (this.args.useRef && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
                def.definitions = this.reffedDefinitions;
            }
            def["$schema"] = "http://json-schema.org/draft-04/schema#";
            return def;
        };
        JsonSchemaGenerator.validationKeywords = [
            "ignore", "description", "type", "minimum", "exclusiveMinimum", "maximum",
            "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "format",
            "pattern", "minItems", "maxItems", "uniqueItems", "default",
            "additionalProperties", "enum"];
        JsonSchemaGenerator.annotedValidationKeywordPattern = /@[a-z.-]+\s*[^@]+/gi;
        return JsonSchemaGenerator;
    }());
    function getProgramFromFiles(files) {
        var options = {
            noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        };
        return ts.createProgram(files, options);
    }
    TJS.getProgramFromFiles = getProgramFromFiles;
    function generateSchema(program, fullTypeName, args) {
        if (args === void 0) { args = getDefaultArgs(); }
        var tc = program.getTypeChecker();
        var diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length == 0) {
            var allSymbols_1 = {};
            var inheritingTypes_1 = {};
            program.getSourceFiles().forEach(function (sourceFile) {
                function inspect(node, tc) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration
                        || node.kind == ts.SyntaxKind.InterfaceDeclaration
                        || node.kind == ts.SyntaxKind.EnumDeclaration
                        || node.kind == ts.SyntaxKind.TypeAliasDeclaration) {
                        var nodeType = tc.getTypeAtLocation(node);
                        var fullName_1 = tc.getFullyQualifiedName(node.symbol);
                        fullName_1 = fullName_1.replace(/".*"\./, "");
                        allSymbols_1[fullName_1] = nodeType;
                        var baseTypes = nodeType.getBaseTypes() || [];
                        baseTypes.forEach(function (baseType) {
                            var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                            if (!inheritingTypes_1[baseName]) {
                                inheritingTypes_1[baseName] = [];
                            }
                            inheritingTypes_1[baseName].push(fullName_1);
                        });
                    }
                    else {
                        ts.forEachChild(node, function (node) { return inspect(node, tc); });
                    }
                }
                inspect(sourceFile, tc);
            });
            var generator = new JsonSchemaGenerator(allSymbols_1, inheritingTypes_1, tc, args);
            var definition = generator.getSchemaForSymbol(fullTypeName);
            return definition;
        }
        else {
            diagnostics.forEach(function (diagnostic) {
                var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                if (diagnostic.file) {
                    var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                    console.warn(diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
                }
                else {
                    console.warn(message);
                }
            });
        }
    }
    TJS.generateSchema = generateSchema;
    function programFromConfig(configFileName) {
        var result = ts.parseConfigFileTextToJson(configFileName, ts.sys.readFile(configFileName));
        var configObject = result.config;
        var configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(configFileName), {}, configFileName);
        var options = configParseResult.options;
        options.noEmit = true;
        delete options.out;
        delete options.outDir;
        delete options.outFile;
        delete options.declaration;
        var program = ts.createProgram(configParseResult.fileNames, options);
        return program;
    }
    TJS.programFromConfig = programFromConfig;
    function exec(filePattern, fullTypeName, args) {
        if (args === void 0) { args = getDefaultArgs(); }
        var program;
        if (path.basename(filePattern) == "tsconfig.json") {
            program = programFromConfig(filePattern);
        }
        else {
            program = TJS.getProgramFromFiles(glob.sync(filePattern));
        }
        var definition = TJS.generateSchema(program, fullTypeName, args);
        var json = JSON.stringify(definition, null, 4) + "\n";
        if (args.out) {
            require("fs").writeFile(args.out, json, function (err) {
                if (err) {
                    console.error("Unable to write output file: " + err.message);
                }
            });
        }
        else {
            process.stdout.write(json);
        }
    }
    TJS.exec = exec;
    function run() {
        var helpText = "Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>";
        var defaultArgs = getDefaultArgs();
        var args = require("yargs")
            .usage(helpText)
            .demand(2)
            .boolean("refs").default("refs", defaultArgs.useRef)
            .describe("refs", "Create shared ref definitions.")
            .boolean("aliasRefs").default("aliasRefs", defaultArgs.useTypeAliasRef)
            .describe("aliasRefs", "Create shared ref definitions for the type aliases.")
            .boolean("topRef").default("topRef", defaultArgs.useRootRef)
            .describe("topRef", "Create a top-level ref definition.")
            .boolean("titles").default("titles", defaultArgs.useTitle)
            .describe("titles", "Creates titles in the output schema.")
            .boolean("defaultProps").default("defaultProps", defaultArgs.useDefaultProperties)
            .describe("defaultProps", "Create default properties definitions.")
            .boolean("noExtraProps").default("noExtraProps", defaultArgs.disableExtraProperties)
            .describe("noExtraProps", "Disable additional properties in objects by default.")
            .boolean("propOrder").default("propOrder", defaultArgs.usePropertyOrder)
            .describe("propOrder", "Create property order definitions.")
            .boolean("required").default("required", defaultArgs.generateRequired)
            .describe("required", "Create required array for non-optional properties.")
            .alias("out", "o")
            .describe("out", "The output file, defaults to using stdout")
            .argv;
        exec(args._[0], args._[1], {
            useRef: args.refs,
            useTypeAliasRef: args.aliasRefs,
            useRootRef: args.topRef,
            useTitle: args.titles,
            useDefaultProperties: args.defaultProps,
            disableExtraProperties: args.noExtraProps,
            usePropertyOrder: args.propOrder,
            generateRequired: args.required,
            out: args.out
        });
    }
    TJS.run = run;
})(TJS = exports.TJS || (exports.TJS = {}));
if (typeof window === "undefined" && require.main === module) {
    TJS.run();
}
//# sourceMappingURL=typescript-json-schema.js.map