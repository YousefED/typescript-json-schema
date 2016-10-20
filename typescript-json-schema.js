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
            strictNullChecks: false,
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
            this.simpleTypesAllowedProperties = [
                "type",
                "description"
            ];
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
        JsonSchemaGenerator.prototype.copyValidationKeywords = function (comment, to, otherAnnotations) {
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
                else {
                    otherAnnotations[keyword] = true;
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
        JsonSchemaGenerator.prototype.parseCommentsIntoDefinition = function (symbol, definition, otherAnnotations) {
            if (!symbol) {
                return;
            }
            var comments = symbol.getDocumentationComment();
            if (!comments || !comments.length) {
                return;
            }
            var joined = comments.map(function (comment) { return comment.text.trim(); }).join("\n");
            joined = this.copyDescription(joined, definition);
            this.copyValidationKeywords(joined, definition, otherAnnotations);
        };
        JsonSchemaGenerator.prototype.extractLiteralValue = function (typ) {
            if (typ.flags & ts.TypeFlags.EnumLiteral) {
                var str = typ.text;
                var num = parseFloat(str);
                return isNaN(num) ? str : num;
            }
            else if (typ.flags & ts.TypeFlags.StringLiteral) {
                return typ.text;
            }
            else if (typ.flags & ts.TypeFlags.NumberLiteral) {
                return parseFloat(typ.text);
            }
            else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
                return typ.intrinsicName == "true";
            }
            return undefined;
        };
        JsonSchemaGenerator.prototype.resolveTupleType = function (propertyType) {
            if (!propertyType.getSymbol() && (propertyType.getFlags() & ts.TypeFlags.Reference))
                return propertyType.target;
            if (!(propertyType.flags & ts.TypeFlags.Tuple))
                return null;
            return propertyType;
        };
        JsonSchemaGenerator.prototype.getDefinitionForRootType = function (propertyType, tc, reffedType, definition) {
            var _this = this;
            var symbol = propertyType.getSymbol();
            var tupleType = this.resolveTupleType(propertyType);
            if (tupleType) {
                var elemTypes = tupleType.elementTypes || propertyType.typeArguments;
                var fixedTypes = elemTypes.map(function (elType) { return _this.getTypeDefinition(elType, tc, undefined, undefined, undefined, reffedType); });
                definition.type = "array";
                definition.items = fixedTypes;
                definition.minItems = fixedTypes.length;
                definition.additionalItems = {
                    "anyOf": fixedTypes
                };
            }
            else {
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
                    case "null":
                        definition.type = "null";
                        break;
                    case "undefined":
                        definition.type = "undefined";
                        break;
                    case "any":
                        break;
                    case "date":
                        definition.type = "string";
                        definition.format = "date-time";
                        break;
                    default:
                        var value = this.extractLiteralValue(propertyType);
                        if (value !== undefined) {
                            definition.type = typeof value;
                            definition.enum = [value];
                        }
                        else if (symbol && symbol.getName() == "Array") {
                            var arrayType = propertyType.typeArguments[0];
                            definition.type = "array";
                            definition.items = this.getTypeDefinition(arrayType, tc, undefined, undefined, undefined, reffedType);
                        }
                        else {
                            var info = propertyType;
                            try {
                                info = JSON.stringify(propertyType);
                            }
                            catch (err) { }
                            console.error("Unsupported type: ", info);
                        }
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
            var enumTypes = [];
            var addType = function (type) {
                if (enumTypes.indexOf(type) == -1)
                    enumTypes.push(type);
            };
            enm.members.forEach(function (member) {
                var caseLabel = member.name.text;
                var constantValue = tc.getConstantValue(member);
                if (constantValue !== undefined) {
                    enumValues.push(constantValue);
                    addType(typeof constantValue);
                }
                else {
                    var initial = member.initializer;
                    if (initial) {
                        if (initial.expression) {
                            var exp = initial.expression;
                            var text = exp.text;
                            if (text) {
                                enumValues.push(text);
                                addType("string");
                            }
                            else if (exp.kind == ts.SyntaxKind.TrueKeyword || exp.kind == ts.SyntaxKind.FalseKeyword) {
                                enumValues.push((exp.kind == ts.SyntaxKind.TrueKeyword));
                                addType("boolean");
                            }
                            else {
                                console.warn("initializer is expression for enum: " + fullName + "." + caseLabel);
                            }
                        }
                        else if (initial.kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                            enumValues.push(initial.getText());
                            addType("string");
                        }
                        else if (initial.kind == ts.SyntaxKind.NullKeyword) {
                            enumValues.push(null);
                            addType("null");
                        }
                    }
                }
            });
            if (enumTypes.length)
                definition.type = (enumTypes.length == 1) ? enumTypes[0] : enumTypes;
            if (enumValues.length > 0) {
                definition["enum"] = enumValues;
            }
            return definition;
        };
        JsonSchemaGenerator.prototype.getUnionDefinition = function (unionType, prop, tc, unionModifier, definition) {
            var enumValues = [];
            var simpleTypes = [];
            var schemas = [];
            var addSimpleType = function (type) {
                if (simpleTypes.indexOf(type) == -1)
                    simpleTypes.push(type);
            };
            var addEnumValue = function (val) {
                if (enumValues.indexOf(val) == -1)
                    enumValues.push(val);
            };
            for (var i = 0; i < unionType.types.length; ++i) {
                var valueType = unionType.types[i];
                var value = this.extractLiteralValue(valueType);
                if (value !== undefined) {
                    addEnumValue(value);
                }
                else {
                    var def = this.getTypeDefinition(unionType.types[i], tc);
                    if (def.type === "undefined") {
                        if (prop)
                            prop.mayBeUndefined = true;
                    }
                    else {
                        var keys = Object.keys(def);
                        if (keys.length == 1 && keys[0] == "type")
                            addSimpleType(def.type);
                        else
                            schemas.push(def);
                    }
                }
            }
            if (enumValues.length > 0) {
                var isOnlyBooleans = enumValues.length == 2 &&
                    typeof enumValues[0] === "boolean" &&
                    typeof enumValues[1] === "boolean" &&
                    enumValues[0] !== enumValues[1];
                if (isOnlyBooleans) {
                    addSimpleType("boolean");
                }
                else {
                    var enumSchema = { enum: enumValues };
                    if (enumValues.every(function (x) { return typeof x == "string"; }))
                        enumSchema.type = "string";
                    else if (enumValues.every(function (x) { return typeof x == "number"; }))
                        enumSchema.type = "number";
                    else if (enumValues.every(function (x) { return typeof x == "boolean"; }))
                        enumSchema.type = "boolean";
                    schemas.push(enumSchema);
                }
            }
            if (simpleTypes.length > 0)
                schemas.push({ type: simpleTypes.length == 1 ? simpleTypes[0] : simpleTypes });
            if (schemas.length == 1) {
                for (var k in schemas[0])
                    definition[k] = schemas[0][k];
            }
            else {
                definition[unionModifier] = schemas;
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
                        if (!(prop.flags & ts.SymbolFlags.Optional) && !prop.mayBeUndefined) {
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
        JsonSchemaGenerator.prototype.addSimpleType = function (def, type) {
            for (var k in def) {
                if (this.simpleTypesAllowedProperties.indexOf(k) == -1)
                    return false;
            }
            if (!def.type) {
                def.type = type;
            }
            else if (def.type.push) {
                if (!def.type.every(function (val) { return typeof val == "string"; }))
                    return false;
                if (def.type.indexOf('null') == -1)
                    def.type.push('null');
            }
            else {
                if (typeof def.type != "string")
                    return false;
                if (def.type != 'null')
                    def.type = [def.type, 'null'];
            }
            return true;
        };
        JsonSchemaGenerator.prototype.makeNullable = function (def) {
            if (!this.addSimpleType(def, 'null')) {
                var union = def.oneOf || def.anyOf;
                if (union)
                    union.push({ type: 'null' });
                else {
                    var subdef = {};
                    for (var k in def) {
                        subdef[k] = def[k];
                        delete def[k];
                    }
                    def.anyOf = [subdef, { type: 'null' }];
                }
            }
            return def;
        };
        JsonSchemaGenerator.prototype.getTypeDefinition = function (typ, tc, asRef, unionModifier, prop, reffedType) {
            if (asRef === void 0) { asRef = this.args.useRef; }
            if (unionModifier === void 0) { unionModifier = "anyOf"; }
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
            var fullTypeName = "";
            var asTypeAliasRef = asRef && reffedType && (this.args.useTypeAliasRef || isStringEnum);
            if (!asTypeAliasRef) {
                var reffedDeclaration = reffedType && reffedType.getDeclarations()[0];
                var isTypeAliasRef = reffedDeclaration && reffedDeclaration.kind === ts.SyntaxKind.TypeAliasDeclaration;
                if (isRawType || (typ.getFlags() & ts.TypeFlags.Anonymous)) {
                    if (isTypeAliasRef) {
                        fullTypeName = reffedDeclaration.name.getText();
                    }
                    else {
                        asRef = false;
                    }
                }
                fullTypeName = fullTypeName !== "" ? fullTypeName : tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            }
            else {
                fullTypeName = tc.getFullyQualifiedName(reffedType);
            }
            if (asRef) {
                returnedDefinition = {
                    "$ref": "#/definitions/" + fullTypeName
                };
            }
            var otherAnnotations = {};
            this.parseCommentsIntoDefinition(reffedType, definition, otherAnnotations);
            if (prop)
                this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations);
            else
                this.parseCommentsIntoDefinition(symbol, definition, otherAnnotations);
            if (!asRef || !this.reffedDefinitions[fullTypeName]) {
                if (asRef) {
                    this.reffedDefinitions[fullTypeName] = definition;
                    if (this.args.useTitle && fullTypeName) {
                        definition.title = fullTypeName;
                    }
                }
                var node = symbol ? symbol.getDeclarations()[0] : null;
                if (typ.flags & ts.TypeFlags.Union) {
                    this.getUnionDefinition(typ, prop, tc, unionModifier, definition);
                }
                else if (typ.flags & ts.TypeFlags.Intersection) {
                    definition.allOf = [];
                    var types = typ.types;
                    for (var i = 0; i < types.length; ++i) {
                        definition.allOf.push(this.getTypeDefinition(types[i], tc));
                    }
                }
                else if (isRawType) {
                    var propDeclaration = prop && prop.getDeclarations && prop.getDeclarations()[0];
                    var newReffedType = (propDeclaration && propDeclaration.type && propDeclaration.type.elementType && propDeclaration.type.elementType.typeName)
                        ? tc.getSymbolAtLocation(propDeclaration.type.elementType.typeName)
                        : reffedType;
                    this.getDefinitionForRootType(typ, tc, newReffedType, definition);
                }
                else if (node && (node.kind == ts.SyntaxKind.EnumDeclaration || node.kind == ts.SyntaxKind.EnumMember)) {
                    this.getEnumDefinition(typ, tc, definition);
                }
                else {
                    this.getClassDefinition(typ, tc, definition);
                }
                if (otherAnnotations['nullable'])
                    this.makeNullable(definition);
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
        JsonSchemaGenerator.prototype.getSchemaForSymbols = function (symbols) {
            var root = {
                "$schema": "http://json-schema.org/draft-04/schema#",
                definitions: {}
            };
            for (var id in symbols) {
                root.definitions[id] = this.getTypeDefinition(symbols[id], this.tc, this.args.useRootRef);
            }
            return root;
        };
        JsonSchemaGenerator.validationKeywords = [
            "ignore", "description", "type", "minimum", "exclusiveMinimum", "maximum",
            "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "format",
            "pattern", "minItems", "maxItems", "uniqueItems", "default",
            "additionalProperties", "enum"];
        JsonSchemaGenerator.annotedValidationKeywordPattern = /@[a-z.-]+\s*[^@]+/gi;
        return JsonSchemaGenerator;
    }());
    function getProgramFromFiles(files, compilerOptions) {
        if (compilerOptions === void 0) { compilerOptions = {}; }
        var options = {
            noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
        };
        for (var k in compilerOptions)
            options[k] = compilerOptions[k];
        return ts.createProgram(files, options);
    }
    TJS.getProgramFromFiles = getProgramFromFiles;
    function generateSchema(program, fullTypeName, args) {
        if (args === void 0) { args = getDefaultArgs(); }
        var tc = program.getTypeChecker();
        var diagnostics = ts.getPreEmitDiagnostics(program);
        if (diagnostics.length == 0) {
            var allSymbols_1 = {};
            var userSymbols_1 = {};
            var inheritingTypes_1 = {};
            program.getSourceFiles().forEach(function (sourceFile, sourceFileIdx) {
                function inspect(node, tc) {
                    if (node.kind == ts.SyntaxKind.ClassDeclaration
                        || node.kind == ts.SyntaxKind.InterfaceDeclaration
                        || node.kind == ts.SyntaxKind.EnumDeclaration
                        || node.kind == ts.SyntaxKind.TypeAliasDeclaration) {
                        var nodeType = tc.getTypeAtLocation(node);
                        var fullName_1 = tc.getFullyQualifiedName(node.symbol);
                        fullName_1 = fullName_1.replace(/".*"\./, "");
                        allSymbols_1[fullName_1] = nodeType;
                        if (!sourceFile.hasNoDefaultLib)
                            userSymbols_1[fullName_1] = nodeType;
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
            var definition = void 0;
            if (fullTypeName == '*') {
                definition = generator.getSchemaForSymbols(userSymbols_1);
            }
            else {
                definition = generator.getSchemaForSymbol(fullTypeName);
            }
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
            program = TJS.getProgramFromFiles(glob.sync(filePattern), {
                strictNullChecks: args.strictNullChecks
            });
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
            .boolean("strictNullChecks").default("strictNullChecks", defaultArgs.strictNullChecks)
            .describe("strictNullChecks", "(TypeScript 2) Make values non-nullable by default.")
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
            strictNullChecks: args.strictNullChecks,
            out: args.out
        });
    }
    TJS.run = run;
})(TJS = exports.TJS || (exports.TJS = {}));
if (typeof window === "undefined" && require.main === module) {
    TJS.run();
}
//# sourceMappingURL=typescript-json-schema.js.map