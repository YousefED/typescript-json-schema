import { assert } from "chai";
import { exec, getDefaultArgs,getProgramFromFiles, generateSchema, Definition } from "../typescript-json-schema";
import {capitalCase} from 'case-anything'

describe("out option", () => {
    it("should have title in capital case", async () => {
        try {
            await exec("test/programs/interface-single/main.ts", "MyObject", {
                ...getDefaultArgs(),
                titles: true,
            });
            const program = getProgramFromFiles(["test/programs/interface-single/main.ts"]);
            let schema = generateSchema(program, "MyObject", {titles: true}); 
            assert.notEqual(schema, null)
            let properties = schema!.properties;
            assert.notEqual(schema!.properties, undefined)
            properties = properties!;
            for (const property of Object.entries(properties)) {
                const key = property[0];
                const value = property[1] as Definition;
                assert.notEqual(value.title, undefined)
                assert.equal(value.title, capitalCase(key))
            }
        } catch (err) {
            assert.fail(`Execution should not have failed: ${err.stack}`);
        }
    });
});
