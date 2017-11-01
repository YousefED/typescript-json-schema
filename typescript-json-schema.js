"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var glob = require("glob");
var stringify = require("json-stable-stringify");
var path = require("path");
var ts = require("typescript");
var vm = require("vm");
var REGEX_FILE_NAME = /".*"\./;
var REGEX_TSCONFIG_NAME = /^.*\.json$/;
var REGEX_TJS_JSDOC = /^-([\w]+)\s+(\S|\S[\s\S]*\S)\s*$/g;
function getDefaultArgs() {
    return {
        ref: true,
        aliasRef: false,
        topRef: false,
        titles: false,
        defaultProps: false,
        noExtraProps: false,
        propOrder: false,
        typeOfKeyword: false,
        required: false,
        strictNullChecks: false,
        ignoreErrors: false,
        out: "",
        validationKeywords: [],
        excludePrivate: false,
    };
}
exports.getDefaultArgs = getDefaultArgs;
function extend(target) {
    var _ = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        _[_i - 1] = arguments[_i];
    }
    if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource != null) {
            for (var nextKey in nextSource) {
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}
function unique(arr) {
    var temp = {};
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var e = arr_1[_i];
        temp[e] = true;
    }
    var r = [];
    for (var k in temp) {
        if (Object.prototype.hasOwnProperty.call(temp, k)) {
            r.push(k);
        }
    }
    return r;
}
var JsonSchemaGenerator = (function () {
    function JsonSchemaGenerator(allSymbols, userSymbols, inheritingTypes, tc, args) {
        if (args === void 0) { args = getDefaultArgs(); }
        this.args = args;
        this.reffedDefinitions = {};
        this.typeNamesById = {};
        this.typeNamesUsed = {};
        this.simpleTypesAllowedProperties = {
            type: true,
            description: true
        };
        this.allSymbols = allSymbols;
        this.userSymbols = userSymbols;
        this.inheritingTypes = inheritingTypes;
        this.tc = tc;
        this.userValidationKeywords = args.validationKeywords.reduce(function (acc, word) {
            return (__assign({}, acc, (_a = {}, _a[word] = true, _a)));
            var _a;
        }, {});
    }
    Object.defineProperty(JsonSchemaGenerator.prototype, "ReffedDefinitions", {
        get: function () {
            return this.reffedDefinitions;
        },
        enumerable: true,
        configurable: true
    });
    JsonSchemaGenerator.prototype.parseValue = function (value) {
        try {
            return JSON.parse(value);
        }
        catch (error) {
            return value;
        }
    };
    JsonSchemaGenerator.prototype.parseCommentsIntoDefinition = function (symbol, definition, otherAnnotations) {
        var _this = this;
        if (!symbol) {
            return;
        }
        var comments = symbol.getDocumentationComment();
        if (comments.length) {
            definition.description = comments.map(function (comment) { return comment.kind === "lineBreak" ? comment.text : comment.text.trim().replace(/\r\n/g, "\n"); }).join("");
        }
        var jsdocs = symbol.getJsDocTags();
        jsdocs.forEach(function (doc) {
            var _a = (doc.name === "TJS" ? new RegExp(REGEX_TJS_JSDOC).exec(doc.text).slice(1, 3) : [doc.name, doc.text]), name = _a[0], text = _a[1];
            if (JsonSchemaGenerator.validationKeywords[name] || _this.userValidationKeywords[name]) {
                definition[name] = _this.parseValue(text);
            }
            else {
                otherAnnotations[doc.name] = true;
            }
        });
    };
    JsonSchemaGenerator.prototype.extractLiteralValue = function (typ) {
        var str = typ.value;
        if (str === undefined) {
            str = typ.text;
        }
        if (typ.flags & ts.TypeFlags.EnumLiteral) {
            var num = parseFloat(str);
            return isNaN(num) ? str : num;
        }
        else if (typ.flags & ts.TypeFlags.StringLiteral) {
            return str;
        }
        else if (typ.flags & ts.TypeFlags.NumberLiteral) {
            return parseFloat(str);
        }
        else if (typ.flags & ts.TypeFlags.BooleanLiteral) {
            return typ.intrinsicName === "true";
        }
        return undefined;
    };
    JsonSchemaGenerator.prototype.resolveTupleType = function (propertyType) {
        if (!propertyType.getSymbol() && (propertyType.getFlags() & ts.TypeFlags.Object && propertyType.objectFlags & ts.ObjectFlags.Reference)) {
            return propertyType.target;
        }
        if (!(propertyType.getFlags() & ts.TypeFlags.Object && propertyType.objectFlags & ts.ObjectFlags.Tuple)) {
            return null;
        }
        return propertyType;
    };
    JsonSchemaGenerator.prototype.getDefinitionForRootType = function (propertyType, tc, reffedType, definition) {
        var _this = this;
        var symbol = propertyType.getSymbol();
        var tupleType = this.resolveTupleType(propertyType);
        if (tupleType) {
            var elemTypes = tupleType.elementTypes || propertyType.typeArguments;
            var fixedTypes = elemTypes.map(function (elType) { return _this.getTypeDefinition(elType, tc); });
            definition.type = "array";
            definition.items = fixedTypes;
            definition.minItems = fixedTypes.length;
            definition.additionalItems = {
                anyOf: fixedTypes
            };
        }
        else {
            var propertyTypeString = tc.typeToString(propertyType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
            switch (propertyTypeString.toLowerCase()) {
                case "string":
                    definition.type = "string";
                    break;
                case "number":
                    var isInteger = (definition.type === "integer" || (reffedType && reffedType.getName() === "integer"));
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
                    else if (symbol && (symbol.getName() === "Array" || symbol.getName() === "ReadonlyArray")) {
                        var arrayType = propertyType.typeArguments[0];
                        definition.type = "array";
                        definition.items = this.getTypeDefinition(arrayType, tc);
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
        return undefined;
    };
    JsonSchemaGenerator.prototype.getDefinitionForProperty = function (prop, tc, node) {
        var propertyName = prop.getName();
        var propertyType = tc.getTypeOfSymbolAtLocation(prop, node);
        var reffedType = this.getReferencedTypeSymbol(prop, tc);
        var definition = this.getTypeDefinition(propertyType, tc, undefined, undefined, prop, reffedType);
        if (this.args.titles) {
            definition.title = propertyName;
        }
        if (definition.hasOwnProperty("ignore")) {
            return null;
        }
        var valDecl = prop.valueDeclaration;
        if (valDecl && valDecl.initializer) {
            var initial = valDecl.initializer;
            if (initial.expression) {
                console.warn("initializer is expression for property " + propertyName);
            }
            else if (initial.kind && initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                definition.default = initial.getText();
            }
            else {
                try {
                    var sandbox = { sandboxvar: null };
                    vm.runInNewContext("sandboxvar=" + initial.getText(), sandbox);
                    var val = sandbox.sandboxvar;
                    if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean" || Object.prototype.toString.call(val) === "[object Array]") {
                        definition.default = val;
                    }
                    else if (val) {
                        console.warn("unknown initializer for property " + propertyName + ": " + val);
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
        var members = node.kind === ts.SyntaxKind.EnumDeclaration ?
            node.members :
            ts.createNodeArray([node]);
        var enumValues = [];
        var enumTypes = [];
        var addType = function (type) {
            if (enumTypes.indexOf(type) === -1) {
                enumTypes.push(type);
            }
        };
        members.forEach(function (member) {
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
                        else if (exp.kind === ts.SyntaxKind.TrueKeyword || exp.kind === ts.SyntaxKind.FalseKeyword) {
                            enumValues.push((exp.kind === ts.SyntaxKind.TrueKeyword));
                            addType("boolean");
                        }
                        else {
                            console.warn("initializer is expression for enum: " + fullName + "." + caseLabel);
                        }
                    }
                    else if (initial.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                        enumValues.push(initial.getText());
                        addType("string");
                    }
                    else if (initial.kind === ts.SyntaxKind.NullKeyword) {
                        enumValues.push(null);
                        addType("null");
                    }
                }
            }
        });
        if (enumTypes.length) {
            definition.type = (enumTypes.length === 1) ? enumTypes[0] : enumTypes;
        }
        if (enumValues.length > 0) {
            definition.enum = enumValues.sort();
        }
        return definition;
    };
    JsonSchemaGenerator.prototype.getUnionDefinition = function (unionType, prop, tc, unionModifier, definition) {
        var enumValues = [];
        var simpleTypes = [];
        var schemas = [];
        var addSimpleType = function (type) {
            if (simpleTypes.indexOf(type) === -1) {
                simpleTypes.push(type);
            }
        };
        var addEnumValue = function (val) {
            if (enumValues.indexOf(val) === -1) {
                enumValues.push(val);
            }
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
                    if (prop) {
                        prop.mayBeUndefined = true;
                    }
                }
                else {
                    var keys = Object.keys(def);
                    if (keys.length === 1 && keys[0] === "type") {
                        if (typeof def.type !== "string") {
                            console.error("Expected only a simple type.");
                        }
                        else {
                            addSimpleType(def.type);
                        }
                    }
                    else {
                        schemas.push(def);
                    }
                }
            }
        }
        if (enumValues.length > 0) {
            var isOnlyBooleans = enumValues.length === 2 &&
                typeof enumValues[0] === "boolean" &&
                typeof enumValues[1] === "boolean" &&
                enumValues[0] !== enumValues[1];
            if (isOnlyBooleans) {
                addSimpleType("boolean");
            }
            else {
                var enumSchema = { enum: enumValues.sort() };
                if (enumValues.every(function (x) { return typeof x === "string"; })) {
                    enumSchema.type = "string";
                }
                else if (enumValues.every(function (x) { return typeof x === "number"; })) {
                    enumSchema.type = "number";
                }
                else if (enumValues.every(function (x) { return typeof x === "boolean"; })) {
                    enumSchema.type = "boolean";
                }
                schemas.push(enumSchema);
            }
        }
        if (simpleTypes.length > 0) {
            schemas.push({ type: simpleTypes.length === 1 ? simpleTypes[0] : simpleTypes });
        }
        if (schemas.length === 1) {
            for (var k in schemas[0]) {
                if (schemas[0].hasOwnProperty(k)) {
                    definition[k] = schemas[0][k];
                }
            }
        }
        else {
            definition[unionModifier] = schemas;
        }
        return definition;
    };
    JsonSchemaGenerator.prototype.getClassDefinition = function (clazzType, tc, definition) {
        var _this = this;
        var node = clazzType.getSymbol().getDeclarations()[0];
        if (this.args.typeOfKeyword && node.kind === ts.SyntaxKind.FunctionType) {
            definition.typeof = "function";
            return definition;
        }
        var clazz = node;
        var props = tc.getPropertiesOfType(clazzType).filter(function (prop) {
            if (!_this.args.excludePrivate) {
                return true;
            }
            var decls = prop.declarations;
            return !(decls && decls.filter(function (decl) {
                var mods = decl.modifiers;
                return mods && mods.filter(function (mod) { return mod.kind === ts.SyntaxKind.PrivateKeyword; }).length > 0;
            }).length > 0);
        });
        var fullName = tc.typeToString(clazzType, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        var modifierFlags = ts.getCombinedModifierFlags(node);
        if (modifierFlags & ts.ModifierFlags.Abstract) {
            var oneOf = this.inheritingTypes[fullName].map(function (typename) {
                return _this.getTypeDefinition(_this.allSymbols[typename], tc);
            });
            definition.oneOf = oneOf;
        }
        else {
            if (clazz.members) {
                var indexSignatures = clazz.members == null ? [] : clazz.members.filter(function (x) { return x.kind === ts.SyntaxKind.IndexSignature; });
                if (indexSignatures.length === 1) {
                    var indexSignature = indexSignatures[0];
                    if (indexSignature.parameters.length !== 1) {
                        throw "Not supported: IndexSignatureDeclaration parameters.length != 1";
                    }
                    var indexSymbol = indexSignature.parameters[0].symbol;
                    var indexType = tc.getTypeOfSymbolAtLocation(indexSymbol, node);
                    var isStringIndexed = (indexType.flags === ts.TypeFlags.String);
                    if (indexType.flags !== ts.TypeFlags.Number && !isStringIndexed) {
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
                }
            }
            var propertyDefinitions = props.reduce(function (all, prop) {
                var propertyName = prop.getName();
                var propDef = _this.getDefinitionForProperty(prop, tc, node);
                if (propDef != null) {
                    all[propertyName] = propDef;
                }
                return all;
            }, {});
            if (definition.type === undefined) {
                definition.type = "object";
            }
            if (definition.type === "object" && Object.keys(propertyDefinitions).length > 0) {
                definition.properties = propertyDefinitions;
            }
            if (this.args.defaultProps) {
                definition.defaultProperties = [];
            }
            if (this.args.noExtraProps && definition.additionalProperties === undefined) {
                definition.additionalProperties = false;
            }
            if (this.args.propOrder) {
                var propertyOrder = props.reduce(function (order, prop) {
                    order.push(prop.getName());
                    return order;
                }, []);
                definition.propertyOrder = propertyOrder;
            }
            if (this.args.required) {
                var requiredProps = props.reduce(function (required, prop) {
                    var def = {};
                    _this.parseCommentsIntoDefinition(prop, def, {});
                    if (!(prop.flags & ts.SymbolFlags.Optional) && !prop.mayBeUndefined && !def.hasOwnProperty("ignore")) {
                        required.push(prop.getName());
                    }
                    return required;
                }, []);
                if (requiredProps.length > 0) {
                    definition.required = unique(requiredProps).sort();
                }
            }
        }
        return definition;
    };
    JsonSchemaGenerator.prototype.addSimpleType = function (def, type) {
        for (var k in def) {
            if (!this.simpleTypesAllowedProperties[k]) {
                return false;
            }
        }
        if (!def.type) {
            def.type = type;
        }
        else if (typeof def.type !== "string") {
            if (!def.type.every(function (val) { return typeof val === "string"; })) {
                return false;
            }
            if (def.type.indexOf("null") === -1) {
                def.type.push("null");
            }
        }
        else {
            if (typeof def.type !== "string") {
                return false;
            }
            if (def.type !== "null") {
                def.type = [def.type, "null"];
            }
        }
        return true;
    };
    JsonSchemaGenerator.prototype.makeNullable = function (def) {
        if (!this.addSimpleType(def, "null")) {
            var union = def.oneOf || def.anyOf;
            if (union) {
                union.push({ type: "null" });
            }
            else {
                var subdef = {};
                for (var k in def) {
                    if (def.hasOwnProperty(k)) {
                        subdef[k] = def[k];
                        delete def[k];
                    }
                }
                def.anyOf = [subdef, { type: "null" }];
            }
        }
        return def;
    };
    JsonSchemaGenerator.prototype.getTypeName = function (typ, tc) {
        var id = typ.id;
        if (this.typeNamesById[id]) {
            return this.typeNamesById[id];
        }
        var baseName = tc.typeToString(typ, undefined, ts.TypeFormatFlags.UseFullyQualifiedType);
        var name = baseName;
        if (this.typeNamesUsed[name]) {
            for (var i = 1; true; ++i) {
                name = baseName + "_" + i;
                if (!this.typeNamesUsed[name]) {
                    break;
                }
            }
        }
        this.typeNamesById[id] = name;
        this.typeNamesUsed[name] = true;
        return name;
    };
    JsonSchemaGenerator.prototype.getTypeDefinition = function (typ, tc, asRef, unionModifier, prop, reffedType, pairedSymbol) {
        if (asRef === void 0) { asRef = this.args.ref; }
        if (unionModifier === void 0) { unionModifier = "anyOf"; }
        var definition = {};
        if (this.args.typeOfKeyword && (typ.flags & ts.TypeFlags.Object) && (typ.objectFlags & ts.ObjectFlags.Anonymous)) {
            definition.typeof = "function";
            return definition;
        }
        var returnedDefinition = definition;
        var symbol = typ.getSymbol();
        var isRawType = (!symbol || symbol.name === "integer" || symbol.name === "Array" || symbol.name === "ReadonlyArray" || symbol.name === "Date");
        var isStringEnum = false;
        if (typ.flags & ts.TypeFlags.Union) {
            var unionType = typ;
            isStringEnum = (unionType.types.every(function (propType) {
                return (propType.getFlags() & ts.TypeFlags.StringLiteral) !== 0;
            }));
        }
        var asTypeAliasRef = asRef && reffedType && (this.args.aliasRef || isStringEnum);
        if (!asTypeAliasRef) {
            if (isRawType || typ.getFlags() & ts.TypeFlags.Object && typ.objectFlags & ts.ObjectFlags.Anonymous) {
                asRef = false;
            }
        }
        var fullTypeName = "";
        if (asTypeAliasRef) {
            fullTypeName = tc.getFullyQualifiedName(reffedType.getFlags() & ts.SymbolFlags.Alias ?
                tc.getAliasedSymbol(reffedType) :
                reffedType).replace(REGEX_FILE_NAME, "");
        }
        else if (asRef) {
            fullTypeName = this.getTypeName(typ, tc);
        }
        if (asRef) {
            returnedDefinition = {
                $ref: "#/definitions/" + fullTypeName
            };
        }
        var otherAnnotations = {};
        this.parseCommentsIntoDefinition(reffedType, definition, otherAnnotations);
        if (prop) {
            this.parseCommentsIntoDefinition(prop, returnedDefinition, otherAnnotations);
        }
        this.parseCommentsIntoDefinition(symbol, definition, otherAnnotations);
        if (!asRef || !this.reffedDefinitions[fullTypeName]) {
            if (asRef) {
                this.reffedDefinitions[fullTypeName] = asTypeAliasRef && reffedType.getFlags() & ts.TypeFlags.IndexedAccess && symbol ? this.getTypeDefinition(typ, tc, true, undefined, symbol, symbol) : definition;
                if (this.args.titles && fullTypeName) {
                    definition.title = fullTypeName;
                }
            }
            var node = symbol && symbol.getDeclarations() !== undefined ? symbol.getDeclarations()[0] : null;
            if (definition.type === undefined) {
                if (typ.flags & ts.TypeFlags.Union) {
                    this.getUnionDefinition(typ, prop, tc, unionModifier, definition);
                }
                else if (typ.flags & ts.TypeFlags.Intersection) {
                    if (this.args.noExtraProps) {
                        definition.additionalProperties = false;
                    }
                    var types = typ.types;
                    for (var i = 0; i < types.length; ++i) {
                        var other = this.getTypeDefinition(types[i], tc, false);
                        definition.type = other.type;
                        definition.properties = extend(definition.properties || {}, other.properties);
                        if (Object.keys(other.default || {}).length > 0) {
                            definition.default = extend(definition.default || {}, other.default);
                        }
                        if (other.required) {
                            definition.required = unique((definition.required || []).concat(other.required)).sort();
                        }
                    }
                }
                else if (isRawType) {
                    if (pairedSymbol) {
                        this.parseCommentsIntoDefinition(pairedSymbol, definition, {});
                    }
                    this.getDefinitionForRootType(typ, tc, reffedType, definition);
                }
                else if (node && (node.kind === ts.SyntaxKind.EnumDeclaration || node.kind === ts.SyntaxKind.EnumMember)) {
                    this.getEnumDefinition(typ, tc, definition);
                }
                else if (symbol && symbol.flags & ts.SymbolFlags.TypeLiteral && symbol.members.size === 0) {
                    definition.type = "object";
                    definition.properties = {};
                }
                else {
                    this.getClassDefinition(typ, tc, definition);
                }
            }
        }
        if (otherAnnotations["nullable"]) {
            this.makeNullable(returnedDefinition);
        }
        return returnedDefinition;
    };
    JsonSchemaGenerator.prototype.setSchemaOverride = function (symbolName, schema) {
        this.reffedDefinitions[symbolName] = schema;
    };
    JsonSchemaGenerator.prototype.getSchemaForSymbol = function (symbolName, includeReffedDefinitions) {
        if (includeReffedDefinitions === void 0) { includeReffedDefinitions = true; }
        if (!this.allSymbols[symbolName]) {
            throw "type " + symbolName + " not found";
        }
        var def = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName] || undefined);
        if (this.args.ref && includeReffedDefinitions && Object.keys(this.reffedDefinitions).length > 0) {
            def.definitions = this.reffedDefinitions;
        }
        def["$schema"] = "http://json-schema.org/draft-04/schema#";
        return def;
    };
    JsonSchemaGenerator.prototype.getSchemaForSymbols = function (symbolNames) {
        var root = {
            $schema: "http://json-schema.org/draft-04/schema#",
            definitions: {}
        };
        for (var i = 0; i < symbolNames.length; i++) {
            var symbolName = symbolNames[i];
            root.definitions[symbolName] = this.getTypeDefinition(this.allSymbols[symbolName], this.tc, this.args.topRef, undefined, undefined, undefined, this.userSymbols[symbolName]);
        }
        return root;
    };
    JsonSchemaGenerator.prototype.getUserSymbols = function () {
        return Object.keys(this.userSymbols);
    };
    JsonSchemaGenerator.prototype.getMainFileSymbols = function (program) {
        var _this = this;
        var files = program.getSourceFiles().filter(function (file) { return !file.isDeclarationFile; });
        if (files.length) {
            return Object.keys(this.userSymbols).filter(function (key) {
                var symbol = _this.userSymbols[key];
                if (!symbol || !symbol.declarations || !symbol.declarations.length) {
                    return false;
                }
                var node = symbol.declarations[0];
                while (node && node.parent) {
                    node = node.parent;
                }
                return files.indexOf(node.getSourceFile()) > -1;
            });
        }
        return [];
    };
    JsonSchemaGenerator.validationKeywords = {
        multipleOf: true,
        maximum: true,
        exclusiveMaximum: true,
        minimum: true,
        exclusiveMinimum: true,
        maxLength: true,
        minLength: true,
        pattern: true,
        maxItems: true,
        minItems: true,
        uniqueItems: true,
        maxProperties: true,
        minProperties: true,
        additionalProperties: true,
        enum: true,
        type: true,
        ignore: true,
        description: true,
        format: true,
        default: true,
        $ref: true,
        id: true
    };
    return JsonSchemaGenerator;
}());
exports.JsonSchemaGenerator = JsonSchemaGenerator;
function getProgramFromFiles(files, compilerOptions) {
    if (compilerOptions === void 0) { compilerOptions = {}; }
    var options = {
        noEmit: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    };
    for (var k in compilerOptions) {
        if (compilerOptions.hasOwnProperty(k)) {
            options[k] = compilerOptions[k];
        }
    }
    return ts.createProgram(files, options);
}
exports.getProgramFromFiles = getProgramFromFiles;
function buildGenerator(program, args) {
    if (args === void 0) { args = {}; }
    var settings = getDefaultArgs();
    for (var pref in args) {
        if (args.hasOwnProperty(pref)) {
            settings[pref] = args[pref];
        }
    }
    var typeChecker = program.getTypeChecker();
    var diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length === 0 || args.ignoreErrors) {
        var allSymbols_1 = {};
        var userSymbols_1 = {};
        var inheritingTypes_1 = {};
        program.getSourceFiles().forEach(function (sourceFile, _sourceFileIdx) {
            function inspect(node, tc) {
                if (node.kind === ts.SyntaxKind.ClassDeclaration
                    || node.kind === ts.SyntaxKind.InterfaceDeclaration
                    || node.kind === ts.SyntaxKind.EnumDeclaration
                    || node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
                    var symbol = node.symbol;
                    var fullName_1 = tc.getFullyQualifiedName(symbol);
                    var nodeType = tc.getTypeAtLocation(node);
                    fullName_1 = fullName_1.replace(/".*"\./, "");
                    allSymbols_1[fullName_1] = nodeType;
                    if (!sourceFile.hasNoDefaultLib) {
                        userSymbols_1[fullName_1] = symbol;
                    }
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
                    ts.forEachChild(node, function (n) { return inspect(n, tc); });
                }
            }
            inspect(sourceFile, typeChecker);
        });
        return new JsonSchemaGenerator(allSymbols_1, userSymbols_1, inheritingTypes_1, typeChecker, settings);
    }
    else {
        diagnostics.forEach(function (diagnostic) {
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                console.error(diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
            }
            else {
                console.error(message);
            }
        });
        return null;
    }
}
exports.buildGenerator = buildGenerator;
function generateSchema(program, fullTypeName, args) {
    if (args === void 0) { args = {}; }
    var generator = buildGenerator(program, args);
    if (generator === null) {
        return null;
    }
    var definition;
    if (fullTypeName === "*") {
        definition = generator.getSchemaForSymbols(generator.getMainFileSymbols(program));
    }
    else {
        definition = generator.getSchemaForSymbol(fullTypeName);
    }
    return definition;
}
exports.generateSchema = generateSchema;
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
exports.programFromConfig = programFromConfig;
function exec(filePattern, fullTypeName, args) {
    if (args === void 0) { args = getDefaultArgs(); }
    var program;
    if (REGEX_TSCONFIG_NAME.test(path.basename(filePattern))) {
        program = programFromConfig(filePattern);
    }
    else {
        program = getProgramFromFiles(glob.sync(filePattern), {
            strictNullChecks: args.strictNullChecks
        });
    }
    var definition = generateSchema(program, fullTypeName, args);
    if (definition === null) {
        return;
    }
    var json = stringify(definition, { space: 4 }) + "\n\n";
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
exports.exec = exec;
function run() {
    var helpText = "Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>";
    var defaultArgs = getDefaultArgs();
    var args = require("yargs")
        .usage(helpText)
        .demand(2)
        .boolean("refs").default("refs", defaultArgs.ref)
        .describe("refs", "Create shared ref definitions.")
        .boolean("aliasRefs").default("aliasRefs", defaultArgs.aliasRef)
        .describe("aliasRefs", "Create shared ref definitions for the type aliases.")
        .boolean("topRef").default("topRef", defaultArgs.topRef)
        .describe("topRef", "Create a top-level ref definition.")
        .boolean("titles").default("titles", defaultArgs.titles)
        .describe("titles", "Creates titles in the output schema.")
        .boolean("defaultProps").default("defaultProps", defaultArgs.defaultProps)
        .describe("defaultProps", "Create default properties definitions.")
        .boolean("noExtraProps").default("noExtraProps", defaultArgs.noExtraProps)
        .describe("noExtraProps", "Disable additional properties in objects by default.")
        .boolean("propOrder").default("propOrder", defaultArgs.propOrder)
        .describe("propOrder", "Create property order definitions.")
        .boolean("typeOfKeyword").default("typeOfKeyword", defaultArgs.typeOfKeyword)
        .describe("typeOfKeyword", "Use typeOf keyword (https://goo.gl/DC6sni) for functions.")
        .boolean("required").default("required", defaultArgs.required)
        .describe("required", "Create required array for non-optional properties.")
        .boolean("strictNullChecks").default("strictNullChecks", defaultArgs.strictNullChecks)
        .describe("strictNullChecks", "Make values non-nullable by default.")
        .boolean("ignoreErrors").default("ignoreErrors", defaultArgs.ignoreErrors)
        .describe("ignoreErrors", "Generate even if the program has errors.")
        .alias("out", "o")
        .describe("out", "The output file, defaults to using stdout")
        .array("validationKeywords").default("validationKeywords", defaultArgs.validationKeywords)
        .describe("validationKeywords", "Provide additional validation keywords to include.")
        .argv;
    exec(args._[0], args._[1], {
        ref: args.refs,
        aliasRef: args.aliasRefs,
        topRef: args.topRef,
        titles: args.titles,
        defaultProps: args.defaultProps,
        noExtraProps: args.noExtraProps,
        propOrder: args.propOrder,
        typeOfKeyword: args.useTypeOfKeyword,
        required: args.required,
        strictNullChecks: args.strictNullChecks,
        ignoreErrors: args.ignoreErrors,
        out: args.out,
        validationKeywords: args.validationKeywords,
        excludePrivate: args.excludePrivate,
    });
}
exports.run = run;
if (typeof window === "undefined" && require.main === module) {
    run();
}
//# sourceMappingURL=typescript-json-schema.js.map