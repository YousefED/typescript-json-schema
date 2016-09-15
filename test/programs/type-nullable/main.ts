
/** @nullable */
type MyType1 = string;

/** @nullable */
type MyType2 = string | number;

/** @nullable */
type MyType3 = string | number[];

/** @nullable */
type MyType4 = number[];

interface MyObject
{
    var1 : MyType1;
    var2 : MyType2;
    var3 : MyType3;
    var4 : MyType4;
}
