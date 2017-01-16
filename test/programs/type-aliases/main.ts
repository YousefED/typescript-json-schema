type MyString = string;

interface MySubObject {
    propA: number;
    propB: number;
}

interface MyObject {
    primitive: MyString;
    object: MySubObject;
}
