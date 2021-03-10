import { assert } from "chai";
import { exec, getDefaultArgs } from "../typescript-json-schema";

describe("error", () => {
    it("error-check", async () => {
        try  {
            await exec("test/programs/dates/", "MyObject", getDefaultArgs());
            assert.fail("Expected exec to fail");
        } catch (err) {
            assert.instanceOf(err, Error);
            assert.equal(err.message, "No output definition. Probably caused by errors prior to this?");
        }
    });
});
