type MyObject = {
    param1: "1" | "2" | "3";
    param2: "1" | "2" | 3 | true;
    /** @enum {string} */
    param3: "1" | "2" | "3";
    /** @enum {unknown} */
    param4: "1" | "2" | 3 | true;
};
