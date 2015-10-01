# typescript-json-schema

Generate json-schemas from your Typescript sources.

Inspired and builds upon [Typson](https://github.com/lbovet/typson/).

## Features
* Compiles your Typescript program to get complete type information.
* Translates required properties, extends, enums, maps, annotation keywords.

## Usage

### Node.js

* Install with `npm install typescript-json-schema -g`
* Generate schema from a typescript type: `typescript-json-schema project/directory/**/*.ts fully.qualified.type.to.generate`