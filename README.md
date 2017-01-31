# typescript-json-schema

[![npm version](https://img.shields.io/npm/v/typescript-json-schema.svg)](https://www.npmjs.com/package/typescript-json-schema) [![Build Status](https://travis-ci.org/YousefED/typescript-json-schema.svg?branch=master)](https://travis-ci.org/YousefED/typescript-json-schema)

Generate json-schemas from your Typescript sources.

## Features

* Compiles your Typescript program to get complete type information.
* Translates required properties, extends, annotation keywords, property initializers as defaults. You can find examples for these features in the [test examples](https://github.com/YousefED/typescript-json-schema/tree/master/test/programs).

## Usage

### Command line

* Install with `npm install typescript-json-schema -g`
* Generate schema from a typescript type: `typescript-json-schema project/directory/tsconfig.json fully.qualified.type.to.generate`

In case no tsconfig.json is available for your project, you can directly specify the .ts files (this in this case we use some built-in compiler presets):

* Generate schema from a typescript type: `typescript-json-schema "project/directory/**/*.ts" fully.qualified.type.to.generate`

```
Usage: node typescript-json-schema.js <path-to-typescript-files-or-tsconfig> <type>

Options:
  --refs              Create shared ref definitions.                        [boolean] [default: true]
  --aliasRefs         Create shared ref definitions for the type aliases.   [boolean] [default: false]
  --topRef            Create a top-level ref definition.                    [boolean] [default: false]
  --titles            Creates titles in the output schema.                  [boolean] [default: false]
  --defaultProps      Create default properties definitions.                [boolean] [default: false]
  --noExtraProps      Disable additional properties in objects by default.  [boolean] [default: false]
  --propOrder         Create property order definitions.                    [boolean] [default: false]
  --required          Create required array for non-optional properties.    [boolean] [default: false]
  --strictNullChecks  Make values non-nullable by default.                  [boolean] [default: false]
  --out, -o           The output file, defaults to using stdout
```

### Programmatic use

```ts
import {resolve} from "path";

import {CompilerOptions} from "typescript";
import * as TJS from "typescript-json-schema";

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
    generateRequired: true
};

// optionally pass ts compiler options
compilerOptions: CompilerOptions = {
    strictNullChecks: true
}

const program = TJS.getProgramFromFiles([resolve("my-file.ts")], compilerOptions);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, "MyType", settings);


// ... or a generator that lets us incrementally get more schemas

const generator = TJS.buildGenerator(program, settings);

// all symbols
const symbols = generator.getUserSymbols();

// Get symbols for different types from generator.
generator.getSchemaForSymbol("MyType");
generator.getSchemaForSymbol("AnotherType");
```

### Annotations

The schema generator converts annotations to JSON schema properties. 

For example

```ts
export interface Shape {
    /**
     * The size of the shape.
     *
     * @minimum 0
     * @TJS-type integer
     */
    size: number;
}
```

will be translated to 
```json
{
    "$ref": "#/definitions/Shape",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "definitions": {
        "Shape": {
            "properties": {
                "size": {
                    "description": "The size of the shape.",
                    "minimum": 0,
                    "type": "integer"
                }
            },
            "type": "object"
        }
    }
}
```

Note that we needed to use `@TJS-type` instead of just `@type` because of an [issue with the typescript compiler](https://github.com/Microsoft/TypeScript/issues/13498). 

## Background

Inspired and builds upon [Typson](https://github.com/lbovet/typson/), but typescript-json-schema is compatible with more recent Typescript versions. Also, since it uses the Typescript compiler internally, more advanced scenarios are possible.
