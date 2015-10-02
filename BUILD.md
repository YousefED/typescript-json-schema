# build process
grunt-typescript uses wrong Typescript version, instead build manually:

tsc typescript-json-schema.ts --module commonjs -outDir dist
