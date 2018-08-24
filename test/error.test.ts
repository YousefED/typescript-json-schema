import { assert } from "chai";
import { exec, getDefaultArgs } from "../typescript-json-schema";
import * as path from 'path';

describe("error", () => {
    it("error-check", () => {
        assert.throws(() => {
            // This needs a valid path. "dates" chosen basically at random
            exec(path.resolve(__dirname, "./programs/dates/"), "MyObject", getDefaultArgs());
        }, Error, "No output definition. Probably caused by errors prior to this?");
    });
});