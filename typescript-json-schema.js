var ts = require("typescript");
var glob = require("glob");
var path = require("path");
var vm = require("vm");
var TJS;
(function (TJS) {
    function getDefaultArgs() {
        return {
            useRef: true,
            useRootRef: false,
            useTitle: false,
            useDefaultProperties: false,
            usePropertyOrder: false,
            generateRequired: false
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
        JsonSchemaGenerator.prototype.parseCommentsIntoDefinition = function (comments, definition) {
            if (!comments || !comments.length) {
                return;
            }
            var joined = comments.map(function (comment) { return comment.text.trim(); }).join("\n");
            joined = this.copyDescription(joined, definition);
            this.copyValidationKeywords(joined, definition);
        };
        JsonSchemaGenerator.prototype.getDefinitionForRootType = function (propertyType, tc, definition, unionModifier) {
            var _this = this;
            if (unionModifier === void 0) { unionModifier = "oneOf"; }
            if (propertyType.flags & ts.TypeFlags.Union) {
                var unionType = propertyType;
                var types = unionType.types.map(function (propType) {
                    return _this.getTypeDefinition(propType, tc);
                });
                definition[unionModifier] = types;
                return definition;
            }
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
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
                    else if (propertyType.getSymbol().getName() == "Array") {
                        var arrayType = propertyType.typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getTypeDefinition(arrayType, tc);
                    }
                    else {
                        definition = this.getTypeDefinition(propertyType, tc);
                    }
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getDefinitionForProperty = function (prop, tc, node) {
            var propertyName = prop.getName();
            var propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var definition = this.getTypeDefinition(propertyType, tc);
            if (this.args.useTitle) {
                definition.title = propertyName;
            }
            var comments = prop.getDocumentationComment();
            this.parseCommentsIntoDefinition(comments, definition);
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
                        if (initial == null) {
                        }
                        else if (typeof (initial) === "string" || typeof (initial) === "number" || typeof (initial) === "boolean" || Object.prototype.toString.call(initial) === '[object Array]') {
                            definition.default = initial;
                        }
                        else {
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
            definition.title = fullName;
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
                if (indexType.flags != ts.TypeFlags.Number) {
                    throw "Not supported: IndexSignatureDeclaration with non-number index symbol";
                }
                var typ = tc.getTypeAtLocation(indexSignature.type);
                var def = this.getTypeDefinition(typ, tc, undefined, "anyOf");
                definition.type = "array";
                definition.items = def;
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
                if (this.args.useTitle) {
                    definition.title = fullName;
                }
                if (this.args.useDefaultProperties) {
                    definition.defaultProperties = [];
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
        JsonSchemaGenerator.prototype.getTypeDefinition = function (typ, tc, asRef, unionModifier) {
            if (asRef === void 0) { asRef = this.args.useRef; }
            if (unionModifier === void 0) { unionModifier = "oneOf"; }
            var fullName = tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var definition = {};
            if (!typ.getSymbol() || typ.getSymbol().name == "Array") {
                return this.getDefinitionForRootType(typ, tc, definition, unionModifier);
            }
            if (!asRef || !this.reffedDefinitions[fullName]) {
                if (asRef) {
                    this.reffedDefinitions[fullName] = definition;
                }
                var node = typ.getSymbol().getDeclarations()[0];
                if (node.kind == ts.SyntaxKind.EnumDeclaration) {
                    this.getEnumDefinition(typ, tc, definition);
                }
                else {
                    this.getClassDefinition(typ, tc, definition);
                }
            }
            if (asRef) {
                return {
                    "$ref": "#/definitions/" + fullName
                };
            }
            else {
                return definition;
            }
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
    })();
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
            var allSymbols = {};
            var inheritingTypes = {};
            program.getSourceFiles().forEach(function (sourceFile) {
                function inspect(node, tc) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration
                        || node.kind == ts.SyntaxKind.InterfaceDeclaration
                        || node.kind == ts.SyntaxKind.EnumDeclaration
                        || node.kind == ts.SyntaxKind.TypeAliasDeclaration) {
                        var nodeType = tc.getTypeAtLocation(node);
                        var fullName = tc.getFullyQualifiedName(node.symbol);
                        fullName = fullName.replace(/".*"\./, "");
                        allSymbols[fullName] = nodeType;
                        var baseTypes = nodeType.getBaseTypes() || [];
                        baseTypes.forEach(function (baseType) {
                            var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                            if (!inheritingTypes[baseName]) {
                                inheritingTypes[baseName] = [];
                            }
                            inheritingTypes[baseName].push(fullName);
                        });
                    }
                    else {
                        ts.forEachChild(node, function (node) { return inspect(node, tc); });
                    }
                }
                inspect(sourceFile, tc);
            });
            var generator = new JsonSchemaGenerator(allSymbols, inheritingTypes, tc, args);
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
        process.stdout.write(JSON.stringify(definition, null, 4) + "\n");
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
            .boolean("topRef").default("topRef", defaultArgs.useRootRef)
            .describe("topRef", "Create a top-level ref definition.")
            .boolean("titles").default("titles", defaultArgs.useTitle)
            .describe("titles", "Creates titles in the output schema.")
            .boolean("defaultProps").default("defaultProps", defaultArgs.useDefaultProperties)
            .describe("defaultProps", "Create default properties definitions.")
            .boolean("propOrder").default("propOrder", defaultArgs.usePropertyOrder)
            .describe("propOrder", "Create property order definitions.")
            .boolean("required").default("required", defaultArgs.generateRequired)
            .describe("required", "Create required array for non-optional properties.")
            .argv;
        exec(args._[0], args._[1], {
            useRef: args.refs,
            useRootRef: args.topRef,
            useTitle: args.titles,
            useDefaultProperties: args.defaultProps,
            usePropertyOrder: args.propOrder,
            generateRequired: args.required
        });
    }
    TJS.run = run;
})(TJS = exports.TJS || (exports.TJS = {}));
if (typeof window === "undefined" && require.main === module) {
    TJS.run();
}
//# sourceMappingURL=typescript-json-schema.js.map