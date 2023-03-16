_Auto-generated file. Updated with NPM deploy. Update manually with 'yarn docs'._

# typescript-json-schema test examples

## [C:\dev\mce\typescript-json-schema\test\programs\abstract-class\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\abstract-class\main.ts)

```ts
export abstract class AbstractBase {
    propA:number;
    propB:string;

    abstract doNotInclude(): void;
}

```


## [C:\dev\mce\typescript-json-schema\test\programs\abstract-extends\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\abstract-extends\main.ts)

```ts
import { AbstractBase } from "../abstract-class/main";

class MyObjectFromAbstract extends AbstractBase {
    doNotInclude(): void { }

    propB:string;
    propC:number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-default\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-default\main.ts)

```ts
interface MyObject {
  /**
   * @default true
   */
  varBoolean: boolean;
  /**
   * @default 123
   */
  varInteger: number;
  /**
   * @default 3.21
   */
  varFloat: number;
  /**
   * @default "foo"
   */
  varString: string;
  /**
   * @default [true, false, true]
   */
  varBooleanArray: boolean[];
  /**
   * @default [1, 2, 3, 4, 5]
   */
  varIntegerArray: number[];
  /**
   * @default [1.23, 65.21, -123.40, 0, 1000000.0001]
   */
  varFloatArray: number[];
  /**
   * @default ["a", "b", "c", "..."]
   */
  varStringArray: string[];
  /**
   * @default [true, 123, 3.21, "foo"]
   */
  varMixedArray: any[];
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-id\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-id\main.ts)

```ts
/**
 * @$id filled#
 */
interface MySubObject {
    a: boolean;
}

interface MyObject {
    /**
     * @$id empty#
     */
    empty;

    filled: MySubObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-items\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-items\main.ts)

```ts
interface MyObject {
  /**
   * @items {"type":"integer"}
   */
  a: number[];

  /**
   * @items {"type":"integer", "minimum":0}
   */
  b: number[];

  /**
   * @items.type integer
   * @items.minimum 0
   */
  c: number[];

  /**
   * @items.type integer
   */
  d: number[];

  /**
   * @items {"type":"string", "format":"email"}
   */
  emails: string[];

  /**
   * @items.type string
   * @items.format email
   */
  emails2: string[];

}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-ref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-ref\main.ts)

```ts
interface MySubObject {}

interface MyObject {
    /**
     * @$ref http://my-schema.org
     */
    externalRef;

    /**
     * @$ref http://my-schema.org
     */
    externalRefOverride: MySubObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-required\examples.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-required\examples.ts)

```ts
import { MyDefaultObject, MySubObject2 } from "./main";

export const mySubObject2Example: MySubObject2[] = [{
    bool: true,
    string: "string",
    object: { prop: 1 }
}];

const myDefaultExample: MyDefaultObject[] = [{
    age: 30,
    name: "me",
    free: true
}]

export default myDefaultExample;
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-required\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-required\main.ts)

```ts
interface MySubObject {
    bool: boolean;
    string: string;
    object: object | null;
    /**
     * @examples require('./examples.ts').mySubObject2Example
     */
    subObject?: MySubObject2;
}

export interface MySubObject2 {
    bool: boolean;
    string: string;
    object: object;
}

export interface MyDefaultObject {
  age: number;
  name: string;
  free?: boolean;
}

export interface MyObject {
    /**
     * @examples require(".").innerExample
     */
    filled: MySubObject;
    /**
     * @examples require('./examples.ts')
     */
    defaultObject: MyDefaultObject;
}

export const innerExample: MySubObject[] = [
    {
        bool: true,
        string: "string",
        object: {}
    },
];
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-title\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-title\main.ts)

```ts
/**
 * @title filled#
 */
interface MySubObject {
    a: boolean;
}

interface MyObject {
    /**
     * @title empty#
     */
    empty;

    filled: MySubObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\annotation-tjs\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\annotation-tjs\main.ts)

```ts
// All of these formats are defined in this specification: http://json-schema.org/latest/json-schema-validation.html#rfc.section.8.3

interface MyRef {}

interface MyObject {
    /**
     * @TJS-format date-time
     */
    dateTime: string;

    /**
     * @TJS-format email
     */
    email: string;

    /**
     * @TJS-format hostname
     */
    hostname: string;

    /**
     * @TJS-format ipv4
     */
    ipv4: string;

    /**
     * @TJS-format ipv6
     */
    ipv6: string;

    /**
     * @TJS-format uri
     */
    uri: string;

    /**
     * @TJS-format uri-reference
     */
    uriReference: string;

    /**
     * @TJS-format uri-template
     */
    uriTemplate: string;

    /**
     * @TJS-format json-pointer
     */
    jsonPointer: string;

    /**
     * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$
     */
    regexPattern: string;

    /**
     * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$
     */
    regexPatternWithWhitespace: string;

    /**
     * @TJS-minimum 5
     */
    oneCharacter: number;

    /**
     * @TJS-examples ["foo", 1]
     */
    examples: string;

    /**
     * @TJS-hide
     */
    booleanAnnotationDefaultValue: string;

    /**
     * @TJS-hide true
     */
    booleanAnnotationWithTrue: string;

    /**
     * @TJS-hide false
     */
    booleanAnnotationWithFalse: string;

    /**
     * @TJS-ignore
     */
    complexWithRefIgnored: MyRef;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\any-unknown\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\any-unknown\main.ts)

```ts
export interface MyObject {
    a: any;
    b: unknown;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\argument-id\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\argument-id\main.ts)

```ts
interface MyObject {
    someProp: string;
    referenceType: ReferenceType;
}

interface ReferenceType {
    reference: true;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\array-and-description\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\array-and-description\main.ts)

```ts
export interface MyObject {
  /**
   * A name
   */
  name?: string;
  description?: string;
  test: any[];
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\array-empty\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\array-empty\main.ts)

```ts
type MyEmptyArray = [];
```


## [C:\dev\mce\typescript-json-schema\test\programs\array-readonly\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\array-readonly\main.ts)

```ts
export type MyReadOnlyArray = ReadonlyArray<number>;
```


## [C:\dev\mce\typescript-json-schema\test\programs\array-types\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\array-types\main.ts)

```ts
type MyArray = Array<string | number>;
```


## [C:\dev\mce\typescript-json-schema\test\programs\builtin-names\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\builtin-names\main.ts)

```ts
declare namespace Ext {
    export class Array {
    }

    export class Foo {
        bar: Ext.Array;
    }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\class-extends\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\class-extends\main.ts)

```ts
class Base {
    propA:number;
}

class MyObject extends Base {
    propB:number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\class-single\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\class-single\main.ts)

```ts
class MyObject {
    constructor() {}
    propA:number;
    propB:number;
    doNotInclude(): void {}
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments\main.ts)

```ts

/**
 * Description of Vector3D, a type alias to a array of integers with length 3
 * If run without useTypeAliasRef, this comment should be ignored but
 * the other annotations should be inherited
 * @minItems 3
 * @maxItems 3
 */
type Vector3D = number[];

/**
 * Description of MyObject, a top level object,
 * which also has a comment that spans
 * multiple lines
 *
 * @additionalProperties false
 * @unsupportedAnnotationThatShouldBeIgnored
 */
interface MyObject {

    /**
     * Description of opacity, a field with min/max values
     * @minimum 0
     * @maximum 100
     */
    opacity: number;

    /**
     * Description of field position, of aliased type Vector3D, which should inherit its annotations
     */
    position: Vector3D;

    /**
     * Description of rotation, a field with an anonymous type
     */
    rotation: {
        /**
         * Description of the value yaw inside an anonymous type, with min/max annotations
         * @minimum -90
         * @maximum 90
         */
        yaw: number;
    };
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-from-lib\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-from-lib\main.ts)

```ts
/**
 * Use this comment
 */
export type MyObject = Pick<BigThing, "prop1">;

/**
 * Not this comment though
 */
interface BigThing {
  prop1: string;
  prop2: string;
};
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-imports\color.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-imports\color.ts)

```ts
/**
 * Description of Color.
 *
 * @pattern ^[0-9a-f]{6}$
 */
export type Color = string;
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-imports\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-imports\main.ts)

```ts
import { Color } from "./color";
import { Text } from "./text";

/** Description of MyObject */
export interface MyObject {
    /** Description of MyObject color property. */
    color: Color;

    /** Description of MyObject text property. */
    text: Text;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-imports\text.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-imports\text.ts)

```ts
import { Color } from "./color";

/**
 * Description of Text interface.
 */
export interface Text {
    /** Description of text property. */
    text: string;

    /** Description of text color property. */
    color: Color;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-inline-tags\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-inline-tags\main.ts)

```ts
/**
 * This is MyOtherObject
 */
interface MyOtherObject {
  prop1: string;
}

/**
 * This is MyObject. It extends {@link MyOtherObject} and {@link SomeOtherObject}.
 */
interface MyObject extends MyOtherObject {
  prop2: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\comments-override\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\comments-override\main.ts)

```ts

/**
 * Type-level description
 * @additionalProperties true
 */
export interface MySubObject {
    value: string;
}

export interface MyObject {
    list: MySubObject[];

    sub1: MySubObject;

    /**
     * Property-level description
     * @additionalProperties false
     */
    sub2: MySubObject;

    /**
     * Date property description
     */
    date: Date;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\custom-dates\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\custom-dates\main.ts)

```ts
namespace foo {
  export interface Date {
    day?: number;
    month?: number;
    year?: number;
  }

  export interface Bar {
    date: Date;
  }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\dates\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\dates\main.ts)

```ts
type DateAlias = Date;

interface MyObject {
    var1: Date;
    var2: DateAlias;
    /**
     * @format date
     */
    var3: Date;
    /**
     * @format date
     */
    var4: DateAlias;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\default-properties\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\default-properties\main.ts)

```ts
type Foo = "a" | "b" | "c" | boolean | number;

class MyObject {
    varBoolean: Foo = <any> false;
    varInteger: Foo = <any> 123;
    varString: Foo = <any> "123";
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-compiled-compute\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-compiled-compute\main.ts)

```ts
enum Enum {
  X = 1 << 1,
  Y = 1 << 2,
  Z = X | Y,
  A = 1,
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-mixed\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-mixed\main.ts)

```ts
enum Enum {
    A, // = 0
    B = 1,
    C = true as any,
    D = "str" as any,
    E = null
}

interface MyObject {
  foo: Enum;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-number\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-number\main.ts)

```ts
enum Enum {
  X = 1,
  Y = 2
}

interface MyObject {
  foo: Enum;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-number-initialized\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-number-initialized\main.ts)

```ts
enum Enum {
  X = 10,
  Y,
  Z,
  A = 1,
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-string\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-string\main.ts)

```ts
enum Enum {
    X = "x" as any,
    Y = "y" as any,
    Z = "123" as any
}

interface MyObject {
    foo: Enum;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\enums-value-in-interface\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\enums-value-in-interface\main.ts)

```ts
export enum A {
  B,
  C,
  D,
};

export interface MyObject {
  code: A.B;
};
```


## [C:\dev\mce\typescript-json-schema\test\programs\extra-properties\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\extra-properties\main.ts)

```ts
export interface MyObject {
    required: string;
    optional?: number;
    [name: string]: string|number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\force-type\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\force-type\main.ts)

```ts
/** @TJS-type number */
export class Widget {}

export interface MyObject {
    name: string;

    mainWidget: Widget;
    otherWidgets: Widget[];
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\force-type-imported\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\force-type-imported\main.ts)

```ts
import { Widget } from "./widget";

export interface MyObject {
    name: string;

    mainWidget: Widget;
    otherWidgets: Widget[];
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\force-type-imported\widget.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\force-type-imported\widget.ts)

```ts
/** @TJS-type number */
export class Widget {}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generate-all-types\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generate-all-types\main.ts)

```ts


interface MyInterface {

}

class MyObject {

}

enum MyEnum {
    Value = 0
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-anonymous\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-anonymous\main.ts)

```ts
interface MyGeneric<A, B> {
    a: A;
    b: B;
}

export interface MyObject {
    value1: MyGeneric<string, number>;
    value2: MyGeneric<number, string>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-arrays\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-arrays\main.ts)

```ts
export interface MyObject {
    numberArray: Array<number>;
    stringArray: ReadonlyArray<string>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-hell\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-hell\main.ts)

```ts
export interface GenericA<A> {
    a: A;
}
export interface B {
    b: number;
}
export interface GenericC<C> {
    c: C;
}

export type SomeAlias<T> = SomeGeneric<T, T>;
export interface SomeGeneric<A, B> {
    a: A;
    b: B;
    c: GenericA<A>;
    d: GenericC<B>;
}

export interface MyObject extends GenericC<GenericC<GenericC<GenericA<string>>>>, B {
    someGeneric: SomeGeneric<1, 2>;
    someAlias: SomeAlias<"alias">;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-multiargs\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-multiargs\main.ts)

```ts
export interface MyGeneric<A, B> {
    a: A;
    b: B;
}

export interface MyObject {
    value1: MyGeneric<string, number>;
    value2: MyGeneric<number, string>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-multiple\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-multiple\main.ts)

```ts
export interface MyGeneric<T> {
    field: T;
}

export interface MyObject {
    value1: MyGeneric<number>;
    value2: MyGeneric<string>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-recursive\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-recursive\main.ts)

```ts
export interface MyGeneric<A, B> {
    field: MyGeneric<B, A>;
}

export interface MyObject {
    value: MyGeneric<string, number>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\generic-simple\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\generic-simple\main.ts)

```ts
export interface MyGeneric<T> {
    field: T;
}

export interface MyObject {
    value: MyGeneric<number>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\ignored-required\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\ignored-required\main.ts)

```ts
interface MyObject {
    /**
     * @ignore
     */
    ignored: boolean;

    /**
     * @ignore
     */
    ignoredOptional?: boolean;

    required: boolean;
    optional?: boolean;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\imports\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\imports\main.ts)

```ts

// This file imports "MyInterface" from the other 2 files
// while also declaring a MyInterface type

import { MyInterface as module1_MyInterface } from "./module1";
import * as module2 from "./module2";

class MyInterface {
    fieldInMain: number;
}

class MyObject {
    a: MyInterface;
    b: module1_MyInterface;
    c: module2.MyInterface;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\imports\module1.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\imports\module1.ts)

```ts

export class MyInterface {
    fieldInModule1: string;
}

```


## [C:\dev\mce\typescript-json-schema\test\programs\imports\module2.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\imports\module2.ts)

```ts

export class MyInterface {
    fieldInModule2: number;
}

```


## [C:\dev\mce\typescript-json-schema\test\programs\interface-extends\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\interface-extends\main.ts)

```ts
interface Base {
    propA: number;
}

export interface MyObject extends Base {
    propB: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\interface-extra-props\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\interface-extra-props\main.ts)

```ts
export interface MyObject {
    required: string;
    optional?: number;
    [name: string]: string|number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\interface-multi\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\interface-multi\main.ts)

```ts
interface MyObject {
    subA: MySubObject;
    subB: MySubObject;
}
interface MySubObject {
    propA: number;
    propB: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\interface-recursion\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\interface-recursion\main.ts)

```ts
interface MyObject {
    propA: number;
    propB: MyObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\interface-single\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\interface-single\main.ts)

```ts
export interface MyObject {
    propA: number;
    propB: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\map-types\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\map-types\main.ts)

```ts

interface MyType {}

interface MyMap1 {
    [id: string]: MyType;
}

/**
 * The additionalProperties annotation should be ignored
 * @additionalProperties false
 */
interface MyMap2 {
    [id: string]: (string | number);
}

type MyMap3 = Readonly<MyMap2>;

interface MyObject {
    map1: MyMap1;
    map2: MyMap2;
    map3: MyMap3;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\module-interface-deep\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\module-interface-deep\main.ts)

```ts
module MyModule {
    export interface Def {
        nest: Def;
        prev: MyModule.Def;
        propA: SubModule.HelperA;
        propB: SubModule.HelperB;
    }
    export module SubModule {
        export interface HelperA {
            propA: number;
            propB: HelperB;
        }
        export interface HelperB {
            propA: SubModule.HelperA;
            propB: Def;
        }
    }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\module-interface-single\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\module-interface-single\main.ts)

```ts
module MyModule {
    interface MyObject {
        propA: number;
        propB: number;
    }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\namespace\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\namespace\main.ts)

```ts
export namespace Types {
  export const X: "x" = "x";
  export const Y: "y" = "y";
}

export type Type = typeof Types.X | typeof Types.Y;
```


## [C:\dev\mce\typescript-json-schema\test\programs\namespace-deep-1\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\namespace-deep-1\main.ts)

```ts
namespace RootNamespace {
    export interface Def {
        nest: Def;
        prev: RootNamespace.Def;

        propA: SubNamespace.HelperA;
        propB: SubNamespace.HelperB;
    }

    export namespace SubNamespace {
        export interface HelperA {
            propA: number;
            propB: HelperB;
        }
        export interface HelperB {
            propA: SubNamespace.HelperA;
            propB: Def;
        }
    }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\namespace-deep-2\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\namespace-deep-2\main.ts)

```ts
namespace RootNamespace {
    export interface Def {
        nest: Def;
        prev: RootNamespace.Def;

        propA: SubNamespace.HelperA;
        propB: SubNamespace.HelperB;
    }

    export namespace SubNamespace {
        export interface HelperA {
            propA: number;
            propB: HelperB;
        }
        export interface HelperB {
            propA: SubNamespace.HelperA;
            propB: Def;
        }
    }
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\never\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\never\main.ts)

```ts
export interface Never {
  neverProp: never;
  propA: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\no-unrelated-definitions\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\no-unrelated-definitions\main.ts)

```ts
export interface MyObject {
  sub: SomeDefinition;
}

interface SomeDefinition {
  is: string;
}

export interface MyOtherObject {
  sub: SomeOtherDefinition;
}

interface SomeOtherDefinition {
  is: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\object-numeric-index\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\object-numeric-index\main.ts)

```ts
interface IndexInterface {
  [index: number]: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\object-numeric-index-as-property\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\object-numeric-index-as-property\main.ts)

```ts
interface Target {
  objAnonymous: {
    [index: number]: number;
  };
  objInterface: IndexInterface;
  indexInType: { [index in number]?: number };
  indexInInline: { [index in number]: number };
  indexInPartialType: IndexInPartial;
  indexInPartialInline: { [index in number]?: number };
}
interface IndexInterface {
  [index: number]: number;
}

type IndexIn = { [index in number]: number };
type IndexInPartial = { [index in number]?: number };
```


## [C:\dev\mce\typescript-json-schema\test\programs\optionals\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\optionals\main.ts)

```ts
interface MyObject {
    required:number;
    optional?:number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\optionals-derived\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\optionals-derived\main.ts)

```ts
interface MyBase {
    baseRequired : number;
    baseOptional?: number;
}

interface MyDerived extends MyBase {
    derivedRequired : number;
    derivedOptional?: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\private-members\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\private-members\main.ts)

```ts
export class MyObject {
    publicMember: string;
    private privateMember: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\prop-override\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\prop-override\main.ts)

```ts
import type { ObjectId } from './third-party'

export type MyObject = {
  /**
   * @TJS-type string
   * @description Overrides aliased type definition with this JSDoc if at least TJS-type annotation is present
   */
  _id: ObjectId
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\prop-override\third-party.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\prop-override\third-party.ts)

```ts
// cannot modify with JSDoc because third-party sources
export class ObjectId {}
```


## [C:\dev\mce\typescript-json-schema\test\programs\satisfies-keyword\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\satisfies-keyword\main.ts)

```ts
interface Basic {
    a: string;
    b: number;
    c: boolean;
}

const myObject = {
    a: "a" as const,
    b: 1 as const,
    c: true as const,
// tslint:disable-next-line:variable-name
} satisfies Basic;

export type Specific = typeof myObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\strict-null-checks\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\strict-null-checks\main.ts)

```ts

class MyObject {
     val: number;
     valNullable: number | null;
     valUndef: number | undefined;
     valOpt?: number;
     valVoid: number | void;

     valTrueOpt?: true;
     valTrueOrNull: true|null;
     valTrue: true|true; // twice to check that it will appear only once
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\string-literals\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\string-literals\main.ts)

```ts
type result = "ok" | "fail" | "abort" | "";

class MyObject {
    foo: result;
    bar: result | string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\string-literals-inline\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\string-literals-inline\main.ts)

```ts
class MyObject {
    foo: "ok" | "fail" | "abort" | "";
    bar: "ok" | "fail" | "abort" | string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\tsconfig\exclude.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\tsconfig\exclude.ts)

```ts
// This file is ignored.

export interface Excluded {
    a: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\tsconfig\includedAlways.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\tsconfig\includedAlways.ts)

```ts
// This file is included by tsconfig.json and --include.

export interface IncludedAlways {
    a: string;
};
```


## [C:\dev\mce\typescript-json-schema\test\programs\tsconfig\includedByConfig.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\tsconfig\includedByConfig.ts)

```ts
// This file is included by tsconfig.json.

export interface IncludedOnlyByTsConfig {
    a: string;
};
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-alias-or\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-alias-or\main.ts)

```ts
interface A {}
interface B {}

type C = A | B;

interface MyObject {
    c: C;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-alias-schema-override\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-alias-schema-override\main.ts)

```ts
interface All {}

type Some = Partial<All>;

interface MyObject {
  some?: Some;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-alias-single\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-alias-single\main.ts)

```ts
type MyString = string;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-alias-single-annotated\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-alias-single-annotated\main.ts)

```ts
/**
 * This is a description
 * @pattern ^mystring-[a-zA-Z0-9]+$
 * @minLength 10
 * @maxLength 24
 */
type MyString = string;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases\main.ts)

```ts
/**
 * My string
 */
type MyString = string;

/**
 * My type alias
 */
type MyAlias = MySubObject;

/**
 * My sub object
 */
interface MySubObject {
    propA: number;
    propB: number;
}

/**
 * My Object
 */
interface MyObject {
    primitive: MyString;
    object: MySubObject;
    alias: MyAlias;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-alias-ref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-alias-ref\main.ts)

```ts

interface MyObject {
    prop: number;
}

type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-alias-ref-topref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-alias-ref-topref\main.ts)

```ts

interface MyObject {
    prop: number;
}

type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-anonymous\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-anonymous\main.ts)

```ts
export type MyExportString = string;
type MyPrivateString = string;

export interface MyObject {
    export: MyExportString;
    private: MyPrivateString;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-fixed-size-array\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-fixed-size-array\main.ts)

```ts
type MyFixedSizeArray = [string, number];

```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-local-namespace\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-local-namespace\main.ts)

```ts
namespace A {
    export interface A { a: any; }
}
namespace B {
    export interface B { b: any; }
}
namespace C {
    import A = B.B;
    export interface C { c: A; }
}
namespace D {
    import A = C.C;
    export interface D { d: A; }
}

export interface MyObject extends D.D {}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-local-namsepace\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-local-namsepace\main.ts)

```ts
namespace A {
    export interface A {a: any;}
}
namespace B {
    export interface B {b: any;}
}
namespace C {
    import A = B.B;
    export interface C {c: A;}
}
namespace D {
    import A = C.C;
    export interface D {d: A;}
}

interface MyObject extends D.D {}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-mixed\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-mixed\main.ts)

```ts
export type MyString = string;

export interface MySubObject {
    propA: number;
    propB: number;
}

export interface MyObject {
    primitive: MyString;
    object: MySubObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-multitype-array\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-multitype-array\main.ts)

```ts

type BasicArray = (string | number)[];

interface MyObject {
    array: BasicArray;
}

type MyArray = (string | MyObject)[];
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-object\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-object\main.ts)

```ts

export interface MyObject {
    number: number;
    string: string;
}

export type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-partial\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-partial\main.ts)

```ts
export interface Foo {
    x: number;
    y: number;
}

export interface Bar {
    a: number;
    b: number;
}

export interface MyObject {
    foo: Partial<Foo>;
    bar: Partial<Bar>;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-primitive\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-primitive\main.ts)

```ts
export type MyString = string;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-alias-topref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-alias-topref\main.ts)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-anonymous\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-anonymous\main.ts)

```ts
interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

export type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-export\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-export\main.ts)

```ts
export interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

export type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-object-topref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-recursive-object-topref\main.ts)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple\main.ts)

```ts
export type MyTuple = [string, number];
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple-of-variable-length\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple-of-variable-length\main.ts)

```ts
export type MyTuple = [string, number, boolean?];
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple-with-rest-element\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-tuple-with-rest-element\main.ts)

```ts
export type MyTuple = [string, ...number[]];
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-union\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-union\main.ts)

```ts

type BasicArray = (string | number)[];

export interface MyObject {
    array: BasicArray;
}

export type MyUnion = (string | MyObject)[];
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-aliases-union-namespace\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-aliases-union-namespace\main.ts)

```ts

export namespace Cardinal {
    export const NORTH: "north" = "north";
    export const SOUTH: "south" = "south";
    export const EAST: "east" = "east";
    export const WEST: "west" = "west";
}

export type Cardinal = typeof Cardinal.NORTH | typeof Cardinal.SOUTH | typeof Cardinal.EAST | typeof Cardinal.WEST;

export interface MyModel {
    direction: Cardinal;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-anonymous\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-anonymous\main.ts)

```ts
 interface MyObject {
    FieldWithAnonType: {
        SubfieldA: number;
        SubfieldB: (string | number);
        SubfieldC: {
            SubsubfieldA: number[];
        }
    };
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-default-number-as-integer\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-default-number-as-integer\main.ts)

```ts
interface MyObject {
    as_integer: number;

    /** @TJS-type number */
    as_number: number;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-function\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-function\main.ts)

```ts
interface MyObject {
    myFunction: Function;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-globalThis\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-globalThis\main.ts)

```ts
export type Test = typeof globalThis;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-intersection\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-intersection\main.ts)

```ts
interface Type1 {
    value1: string;
    value2: number;
}
interface Type2 {
    value2: number;
    value3: boolean;
}

interface MyObject {
    value: Type1 & Type2;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-intersection-recursive\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-intersection-recursive\main.ts)

```ts
interface ChildFoo {
}

interface Foo {
    readonly childFoos: Foo & ChildFoo;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-intersection-recursive-no-additional\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-intersection-recursive-no-additional\main.ts)

```ts
type MyRecursiveNode = {
    next?: MyNode;
}

type MyNode = {
    val: string;
} & MyRecursiveNode;

type MyLinkedList = MyNode;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-mapped-types\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-mapped-types\main.ts)

```ts
type Keys = "str1" | "str2";

type MyMappedType = {
  [key in Keys]: string;
};
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-no-aliases-recursive-topref\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-no-aliases-recursive-topref\main.ts)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-nullable\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-nullable\main.ts)

```ts

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
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-primitives\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-primitives\main.ts)

```ts
/* tslint:disable:no-inferrable-types */

// Special type, should not appear in the schema
type integer = number;

class MyObject {

    boolean1: boolean     = true;

    number1: number       = 1;

    /** @TJS-type integer */
    integer1: number      = 1;
    integer2: integer     = 1;

    string1: string       = "defaultValue";

    array1: Array<any>    = null;
    array2: Array<number> = null;

    object1: any          = null;
    object2: {}           = null;
    object3: object       = null;

}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-recursive\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-recursive\main.ts)

```ts
/**
 * A recursive type
 */
export type TestChildren = TestChild | Array<TestChild | TestChildren>;

interface TestChild {
    type: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-union\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-union\main.ts)

```ts

// Simple union (generates "type": [...])
type MyType1 = string | number;

// Non-simple union (generates a "oneOf"/"anyOf")
type MyType2 = string | number[];

interface MyObject {
    var1: MyType1;
    var2: MyType2;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\type-union-tagged\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\type-union-tagged\main.ts)

```ts

interface Square {
    kind: "square";
    size: number;
}

interface Rectangle {
    kind: "rectangle";
    width: number;
    height: number;
}

interface Circle {
    kind: "circle";
    radius: number;
}

type Shape = Square | Rectangle | Circle;
```


## [C:\dev\mce\typescript-json-schema\test\programs\typeof-keyword\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\typeof-keyword\main.ts)

```ts
interface MyObject {
  foo: () => string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\unique-names\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\unique-names\main.ts)

```ts
import "./other";

class MyObject {
  is: "MyObject_1";
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\unique-names\other.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\unique-names\other.ts)

```ts
class MyObject {
  is: "MyObject_2";
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\unique-names-multiple-subdefinitions\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\unique-names-multiple-subdefinitions\main.ts)

```ts
import "./other";

class SubObject {
  is: "SubObject_1";
}

class MyObject {
  sub: SubObject;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\unique-names-multiple-subdefinitions\other.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\unique-names-multiple-subdefinitions\other.ts)

```ts
class SubObject {
  is: "SubObject_2";
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\user-symbols\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\user-symbols\main.ts)

```ts
export interface Context {
  ip: string;
}
```


## [C:\dev\mce\typescript-json-schema\test\programs\user-validation-keywords\main.ts](./test/programs/C:\dev\mce\typescript-json-schema\test\programs\user-validation-keywords\main.ts)

```ts
export interface MyObject {
  /**
   * Must be 'first' or 'last'
   *
   * @minLength 1
   * @chance {
   *   "pickone": [ [ "first", "last" ] ]
   * }
   * @ignoreThis 2
   * @important
   */
  name: string;
}
```


