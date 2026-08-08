import { assert } from "chai";
import { resolve } from "path";
import * as TJS from "../typescript-json-schema";

describe("user file path matching", () => {
    it("should treat equivalent slash styles as the same user file", () => {
        const file = resolve("test/programs/comments/main.ts");
        const alternateFile = file.includes("\\") ? file.replace(/\\/g, "/") : file.replace(/\//g, "\\");
        const program = TJS.getProgramFromFiles([file]);
        const generator = TJS.buildGenerator(program, {}, [alternateFile]);

        assert.instanceOf(generator, TJS.JsonSchemaGenerator);
        assert.include(generator!.getUserSymbols(), "MyObject");
        assert.include(generator!.getMainFileSymbols(program, [alternateFile]), "MyObject");
    });
});
