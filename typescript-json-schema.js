var ts = require("typescript");
var glob = require("glob");
var path = require("path");
var vm = require("vm");
var TJS;
(function (TJS) {
    var defaultArgs = {
        useRef: true,
        useRootRef: false,
        useTitle: false,
        useDefaultProperties: false,
        usePropertyOrder: false
    };
    var JsonSchemaGenerator = (function () {
        function JsonSchemaGenerator(allSymbols, inheritingTypes, tc, args) {
            if (args === void 0) { args = defaultArgs; }
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
        JsonSchemaGenerator.prototype.getDefinitionForType = function (propertyType, tc) {
            var _this = this;
            if (propertyType.flags & ts.TypeFlags.Union) {
                var unionType = propertyType;
                var oneOf = unionType.types.map(function (propType) {
                    return _this.getDefinitionForType(propType, tc);
                });
                return {
                    "oneOf": oneOf
                };
            }
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var definition = {};
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
                        var arrayType = propertyType.typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getDefinitionForType(arrayType, tc);
                    }
                    else {
                        var definition_1 = this.getTypeDefinition(propertyType, tc);
                        return definition_1;
                    }
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getDefinitionForProperty = function (prop, tc, node) {
            var propertyName = prop.getName();
            var propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            var definition = this.getDefinitionForType(propertyType, tc);
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
        JsonSchemaGenerator.prototype.getTypeDefinition = function (typ, tc) {
            var node = typ.getSymbol().getDeclarations()[0];
            if (node.kind == ts.SyntaxKind.EnumDeclaration) {
                return this.getEnumDefinition(typ, tc);
            }
            else {
                return this.getClassDefinition(typ, tc);
            }
        };
        JsonSchemaGenerator.prototype.getEnumDefinition = function (clazzType, tc, asRef) {
            if (asRef === void 0) { asRef = this.args.useRef; }
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
            }
            else {
                return definition;
            }
        };
        JsonSchemaGenerator.prototype.getClassDefinition = function (clazzType, tc, asRef) {
            var _this = this;
            if (asRef === void 0) { asRef = this.args.useRef; }
            var node = clazzType.getSymbol().getDeclarations()[0];
            var clazz = node;
            var props = tc.getPropertiesOfType(clazzType);
            var fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            if (clazz.flags & ts.NodeFlags.Abstract) {
                var oneOf = this.inheritingTypes[fullName].map(function (typename) {
                    return _this.getTypeDefinition(_this.allSymbols[typename], tc);
                });
                var definition = {
                    "oneOf": oneOf
                };
                return definition;
            }
            else {
                var propertyDefinitions = props.reduce(function (all, prop) {
                    var propertyName = prop.getName();
                    var definition = _this.getDefinitionForProperty(prop, tc, node);
                    if (definition != null) {
                        all[propertyName] = definition;
                    }
                    return all;
                }, {});
                var propertyOrder = props.reduce(function (order, prop) {
                    order.push(prop.getName());
                    return order;
                }, []);
                var definition = {
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
                }
                else {
                    return definition;
                }
            }
        };
        JsonSchemaGenerator.prototype.getClassDefinitionByName = function (clazzName, includeReffedDefinitions) {
            if (includeReffedDefinitions === void 0) { includeReffedDefinitions = true; }
            var def = this.getClassDefinition(this.allSymbols[clazzName], this.tc, this.args.useRootRef);
            if (this.args.useRef && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
                def.definitions = this.reffedDefinitions;
            }
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
        if (args === void 0) { args = defaultArgs; }
        var tc = program.getTypeChecker();
        var diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length == 0) {
            var allSymbols = {};
            var inheritingTypes = {};
            program.getSourceFiles().forEach(function (sourceFile) {
                function inspect(node, tc) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration
                        || node.kind == ts.SyntaxKind.InterfaceDeclaration
                        || node.kind == ts.SyntaxKind.EnumDeclaration) {
                        var nodeType = tc.getTypeAtLocation(node);
                        var fullName = tc.typeToString(nodeType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                        if (node.kind == ts.SyntaxKind.EnumDeclaration) {
                            allSymbols[fullName] = nodeType;
                        }
                        else {
                            allSymbols[fullName] = nodeType;
                            nodeType.getBaseTypes().forEach(function (baseType) {
                                var baseName = tc.typeToString(baseType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
                                if (!inheritingTypes[baseName]) {
                                    inheritingTypes[baseName] = [];
                                }
                                inheritingTypes[baseName].push(fullName);
                            });
                        }
                    }
                    else {
                        ts.forEachChild(node, function (node) { return inspect(node, tc); });
                    }
                }
                inspect(sourceFile, tc);
            });
            var generator = new JsonSchemaGenerator(allSymbols, inheritingTypes, tc, args);
            var definition = generator.getClassDefinitionByName(fullTypeName);
            definition["$schema"] = "http://json-schema.org/draft-04/schema#";
            return definition;
        }
        else {
            diagnostics.forEach(function (diagnostic) { return console.warn(diagnostic.messageText + " " + diagnostic.file.fileName + " " + diagnostic.start); });
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
    TJS.run = run;
})(TJS = exports.TJS || (exports.TJS = {}));
if (typeof window === "undefined" && require.main === module) {
    TJS.run();
}
//# sourceMappingURL=typescript-json-schema.js.map