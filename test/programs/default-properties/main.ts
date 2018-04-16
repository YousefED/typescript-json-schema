type Foo = "a" | "b" | "c" | boolean | number;

class MyObject {
    varBoolean: Foo = <any> false;
    varInteger: Foo = <any> 123;
    varString: Foo = <any> "123";
}
