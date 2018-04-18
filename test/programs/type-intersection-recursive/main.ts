interface ChildFoo {
}

interface Foo {
    readonly childFoos: Foo & ChildFoo;
}
