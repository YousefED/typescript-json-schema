
/** @nullable */
type MyType1 = string;

/** @nullable */
type MyType2 = string | number;

/** @nullable */
type MyType3 = string | number[];

/** @nullable */
type MyType4 = number[];

type Ref = { foo: number };

/** @nullable */
type MyType5 = Ref;

interface MyType6 {};

interface MyObject {
    var1: MyType1;
    var2: MyType2;
    var3: MyType3;
    var4: MyType4;
    var5: MyType5;

    /**
     * @nullable
     */
    var6: MyType6;
    var7: MyType6;
}
