
// Simple union (generates "type": [...])
type MyType1 = string | number;

// Non-simple union (generates a "oneOf"/"anyOf")
type MyType2 = string | number[];

interface MyObject {
    var1: MyType1;
    var2: MyType2;
}
