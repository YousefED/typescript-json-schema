# typescript-json-schema

Generate json-schemas from your Typescript sources.

Inspired and builds upon [Typson](https://github.com/lbovet/typson/), but typescript-json-schema is compatible with more recent Typescript versions. Also, since it uses the Typescript compiler internally, more advanced scenarios are possible.

## Features
* Compiles your Typescript program to get complete type information.
* Translates required properties, extends, annotation keywords, property intializers as defaults.

## Usage

### Node.js

* Install with `npm install typescript-json-schema -g`
* Generate schema from a typescript type: `typescript-json-schema project/directory/**/*.ts fully.qualified.type.to.generate`

## TODO
* better support for maps, enums
