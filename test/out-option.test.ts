import { assert } from "chai";
import { exec, getDefaultArgs } from "../typescript-json-schema";

describe("out option", () => {
    beforeEach(() => new Promise((resolve, reject) => {
        require("fs").rm(
            "./dist/test/doesnotexist",
            { recursive: true, force: true },
            (err: Error) => (err ? reject(err) : resolve(null))
        );
    }));
    it("should create parent directory when necessary", async () => {
        try {
            await exec(
                "test/programs/interface-single/main.ts",
                "MyObject",
                { ...getDefaultArgs(), out: "./dist/test/doesnotexist/schema.json" }
            );
        } catch (err) {
            assert.fail(`Execution should not have failed: ${err.stack}`);
        }
    });
});
