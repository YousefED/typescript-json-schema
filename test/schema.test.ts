import {assert} from "chai";
import {TJS} from "../typescript-json-schema";
import {readFileSync} from 'fs';
import {resolve} from 'path';

const base = "test/programs/";

export function assertSchema(group: string, name: string, type: string, settings?: any) {
    it(group + " should create correct schema", function() {
        if(!settings) {
            settings = TJS.getDefaultArgs();
            settings.generateRequired = true;
        }
        
        const actual = TJS.generateSchema(TJS.getProgramFromFiles([resolve(base + group + "/" + name)]), type, settings);

        const file = readFileSync(base + group + "/schema.json", "utf8")
        const expected = JSON.parse(file);

        assert.isObject(actual);
        assert.deepEqual(actual, expected);
    });
}

describe("schema", function () {
    assertSchema("array-and-description", "main.ts", "MyObject");
    assertSchema("class-single", "main.ts", "MyObject");

    assertSchema("interface-single", "main.ts", "MyObject");
    assertSchema("interface-multi", "main.ts", "MyObject");
    
    let settings = TJS.getDefaultArgs();
    settings.useRootRef = true;
    assertSchema("interface-recursion", "main.ts", "MyObject", settings); // this sample needs rootRef
    
    assertSchema("module-interface-single", "main.ts", "MyObject");

    // not supported right now
    //assertSchema("module-interface-deep", "main.ts", "Def");

    assertSchema("enums-string", "main.ts", "MyObject");

    // not yet working
    // assertSchema("string-literals", "main.ts", "result");
    
    assertSchema("array-types", "main.ts", "MyArray");
    assertSchema("type-union", "main.ts", "MyType");
    assertSchema("type-aliases", "main.ts", "MyString");
    assertSchema("type-aliases-fixed-size-array", "main.ts", "MyFixedSizeArray");

    assertSchema("optionals", "main.ts", "MyObject");
    
});
