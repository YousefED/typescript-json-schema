type result = "ok" | "fail" | "abort";

class MyObject {
    foo: result;
    bar: result | string;
}
