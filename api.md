_Auto-generated file. Updated with NPM deploy. Update manually with 'yarn docs'._

# typescript-json-schema test examples

## [abstract-class](./test/programs/abstract-class)

```ts
export abstract class AbstractBase {
    propA:number;
    propB:string;

    abstract doNotInclude(): void;
}

```


## [abstract-extends](./test/programs/abstract-extends)

```ts
import { AbstractBase } from "../abstract-class/main";

class MyObjectFromAbstract extends AbstractBase {
    doNotInclude(): void { }

    propB:string;
    propC:number;
}
```


## [annotation-default](./test/programs/annotation-default)

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


## [annotation-id](./test/programs/annotation-id)

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


## [annotation-items](./test/programs/annotation-items)

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


## [annotation-ref](./test/programs/annotation-ref)

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


## [annotation-required](./test/programs/annotation-required)

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


## [annotation-required](./test/programs/annotation-required)

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


## [annotation-title](./test/programs/annotation-title)

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


## [annotation-tjs](./test/programs/annotation-tjs)

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


## [any-unknown](./test/programs/any-unknown)

```ts
export interface MyObject {
    a: any;
    b: unknown;
}
```


## [argument-id](./test/programs/argument-id)

```ts
interface MyObject {
    someProp: string;
    referenceType: ReferenceType;
}

interface ReferenceType {
    reference: true;
}
```


## [array-and-description](./test/programs/array-and-description)

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


## [array-empty](./test/programs/array-empty)

```ts
type MyEmptyArray = [];
```


## [array-readonly](./test/programs/array-readonly)

```ts
export type MyReadOnlyArray = ReadonlyArray<number>;
```


## [array-types](./test/programs/array-types)

```ts
type MyArray = Array<string | number>;
```


## [builtin-names](./test/programs/builtin-names)

```ts
declare namespace Ext {
    export class Array {
    }

    export class Foo {
        bar: Ext.Array;
    }
}
```


## [class-extends](./test/programs/class-extends)

```ts
class Base {
    propA:number;
}

class MyObject extends Base {
    propB:number;
}
```


## [class-single](./test/programs/class-single)

```ts
class MyObject {
    constructor() {}
    propA:number;
    propB:number;
    doNotInclude(): void {}
}
```


## [comments](./test/programs/comments)

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


## [comments-from-lib](./test/programs/comments-from-lib)

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


## [comments-imports](./test/programs/comments-imports)

```ts
/**
 * Description of Color.
 *
 * @pattern ^[0-9a-f]{6}$
 */
export type Color = string;
```


## [comments-imports](./test/programs/comments-imports)

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


## [comments-imports](./test/programs/comments-imports)

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


## [comments-inline-tags](./test/programs/comments-inline-tags)

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


## [comments-override](./test/programs/comments-override)

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


## [custom-dates](./test/programs/custom-dates)

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


## [dates](./test/programs/dates)

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


## [default-properties](./test/programs/default-properties)

```ts
type Foo = "a" | "b" | "c" | boolean | number;

class MyObject {
    varBoolean: Foo = <any> false;
    varInteger: Foo = <any> 123;
    varString: Foo = <any> "123";
}
```


## [enums-compiled-compute](./test/programs/enums-compiled-compute)

```ts
enum Enum {
  X = 1 << 1,
  Y = 1 << 2,
  Z = X | Y,
  A = 1,
}
```


## [enums-mixed](./test/programs/enums-mixed)

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


## [enums-number](./test/programs/enums-number)

```ts
enum Enum {
  X = 1,
  Y = 2
}

interface MyObject {
  foo: Enum;
}
```


## [enums-number-initialized](./test/programs/enums-number-initialized)

```ts
enum Enum {
  X = 10,
  Y,
  Z,
  A = 1,
}
```


## [enums-string](./test/programs/enums-string)

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


## [enums-value-in-interface](./test/programs/enums-value-in-interface)

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


## [extra-properties](./test/programs/extra-properties)

```ts
export interface MyObject {
    required: string;
    optional?: number;
    [name: string]: string|number;
}
```


## [force-type](./test/programs/force-type)

```ts
/** @TJS-type number */
export class Widget {}

export interface MyObject {
    name: string;

    mainWidget: Widget;
    otherWidgets: Widget[];
}
```


## [force-type-imported](./test/programs/force-type-imported)

```ts
import { Widget } from "./widget";

export interface MyObject {
    name: string;

    mainWidget: Widget;
    otherWidgets: Widget[];
}
```


## [force-type-imported](./test/programs/force-type-imported)

```ts
/** @TJS-type number */
export class Widget {}
```


## [generate-all-types](./test/programs/generate-all-types)

```ts


interface MyInterface {

}

class MyObject {

}

enum MyEnum {
    Value = 0
}
```


## [generic-anonymous](./test/programs/generic-anonymous)

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


## [generic-arrays](./test/programs/generic-arrays)

```ts
export interface MyObject {
    numberArray: Array<number>;
    stringArray: ReadonlyArray<string>;
}
```


## [generic-hell](./test/programs/generic-hell)

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


## [generic-multiargs](./test/programs/generic-multiargs)

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


## [generic-multiple](./test/programs/generic-multiple)

```ts
export interface MyGeneric<T> {
    field: T;
}

export interface MyObject {
    value1: MyGeneric<number>;
    value2: MyGeneric<string>;
}
```


## [generic-recursive](./test/programs/generic-recursive)

```ts
export interface MyGeneric<A, B> {
    field: MyGeneric<B, A>;
}

export interface MyObject {
    value: MyGeneric<string, number>;
}
```


## [generic-simple](./test/programs/generic-simple)

```ts
export interface MyGeneric<T> {
    field: T;
}

export interface MyObject {
    value: MyGeneric<number>;
}
```


## [ignored-required](./test/programs/ignored-required)

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


## [imports](./test/programs/imports)

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


## [imports](./test/programs/imports)

```ts

export class MyInterface {
    fieldInModule1: string;
}

```


## [imports](./test/programs/imports)

```ts

export class MyInterface {
    fieldInModule2: number;
}

```


## [interface-extends](./test/programs/interface-extends)

```ts
interface Base {
    propA: number;
}

export interface MyObject extends Base {
    propB: number;
}
```


## [interface-extra-props](./test/programs/interface-extra-props)

```ts
export interface MyObject {
    required: string;
    optional?: number;
    [name: string]: string|number;
}
```


## [interface-multi](./test/programs/interface-multi)

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


## [interface-recursion](./test/programs/interface-recursion)

```ts
interface MyObject {
    propA: number;
    propB: MyObject;
}
```


## [interface-single](./test/programs/interface-single)

```ts
export interface MyObject {
    propA: number;
    propB: number;
}
```


## [map-types](./test/programs/map-types)

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


## [module-interface-deep](./test/programs/module-interface-deep)

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


## [module-interface-single](./test/programs/module-interface-single)

```ts
module MyModule {
    interface MyObject {
        propA: number;
        propB: number;
    }
}
```


## [namespace](./test/programs/namespace)

```ts
export namespace Types {
  export const X: "x" = "x";
  export const Y: "y" = "y";
}

export type Type = typeof Types.X | typeof Types.Y;
```


## [namespace-deep-1](./test/programs/namespace-deep-1)

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


## [namespace-deep-2](./test/programs/namespace-deep-2)

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


## [never](./test/programs/never)

```ts
export interface Never {
  neverProp: never;
  propA: string;
}
```


## [no-unrelated-definitions](./test/programs/no-unrelated-definitions)

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


## [object-numeric-index](./test/programs/object-numeric-index)

```ts
interface IndexInterface {
  [index: number]: number;
}
```


## [object-numeric-index-as-property](./test/programs/object-numeric-index-as-property)

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


## [optionals](./test/programs/optionals)

```ts
interface MyObject {
    required:number;
    optional?:number;
}
```


## [optionals-derived](./test/programs/optionals-derived)

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


## [private-members](./test/programs/private-members)

```ts
export class MyObject {
    publicMember: string;
    private privateMember: string;
}
```


## [prop-override](./test/programs/prop-override)

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


## [prop-override](./test/programs/prop-override)

```ts
// cannot modify with JSDoc because third-party sources
export class ObjectId {}
```


## [strict-null-checks](./test/programs/strict-null-checks)

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


## [string-literals](./test/programs/string-literals)

```ts
type result = "ok" | "fail" | "abort" | "";

class MyObject {
    foo: result;
    bar: result | string;
}
```


## [string-literals-inline](./test/programs/string-literals-inline)

```ts
class MyObject {
    foo: "ok" | "fail" | "abort" | "";
    bar: "ok" | "fail" | "abort" | string;
}
```


## [tsconfig](./test/programs/tsconfig)

```ts
// This file is ignored.

export interface Excluded {
    a: string;
}
```


## [tsconfig](./test/programs/tsconfig)

```ts
// This file is included by tsconfig.json and --include.

export interface IncludedAlways {
    a: string;
};
```


## [tsconfig](./test/programs/tsconfig)

```ts
// This file is included by tsconfig.json.

export interface IncludedOnlyByTsConfig {
    a: string;
};
```


## [type-alias-or](./test/programs/type-alias-or)

```ts
interface A {}
interface B {}

type C = A | B;

interface MyObject {
    c: C;
}
```


## [type-alias-schema-override](./test/programs/type-alias-schema-override)

```ts
interface All {}

type Some = Partial<All>;

interface MyObject {
  some?: Some;
}
```


## [type-alias-single](./test/programs/type-alias-single)

```ts
type MyString = string;
```


## [type-alias-single-annotated](./test/programs/type-alias-single-annotated)

```ts
/**
 * This is a description
 * @pattern ^mystring-[a-zA-Z0-9]+$
 * @minLength 10
 * @maxLength 24
 */
type MyString = string;
```


## [type-aliases](./test/programs/type-aliases)

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


## [type-aliases-alias-ref](./test/programs/type-aliases-alias-ref)

```ts

interface MyObject {
    prop: number;
}

type MyAlias = MyObject;
```


## [type-aliases-alias-ref-topref](./test/programs/type-aliases-alias-ref-topref)

```ts

interface MyObject {
    prop: number;
}

type MyAlias = MyObject;
```


## [type-aliases-anonymous](./test/programs/type-aliases-anonymous)

```ts
export type MyExportString = string;
type MyPrivateString = string;

export interface MyObject {
    export: MyExportString;
    private: MyPrivateString;
}
```


## [type-aliases-fixed-size-array](./test/programs/type-aliases-fixed-size-array)

```ts
type MyFixedSizeArray = [string, number];

```


## [type-aliases-local-namespace](./test/programs/type-aliases-local-namespace)

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


## [type-aliases-local-namsepace](./test/programs/type-aliases-local-namsepace)

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


## [type-aliases-mixed](./test/programs/type-aliases-mixed)

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


## [type-aliases-multitype-array](./test/programs/type-aliases-multitype-array)

```ts

type BasicArray = (string | number)[];

interface MyObject {
    array: BasicArray;
}

type MyArray = (string | MyObject)[];
```


## [type-aliases-object](./test/programs/type-aliases-object)

```ts

export interface MyObject {
    number: number;
    string: string;
}

export type MyAlias = MyObject;
```


## [type-aliases-partial](./test/programs/type-aliases-partial)

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


## [type-aliases-primitive](./test/programs/type-aliases-primitive)

```ts
export type MyString = string;
```


## [type-aliases-recursive-alias-topref](./test/programs/type-aliases-recursive-alias-topref)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [type-aliases-recursive-anonymous](./test/programs/type-aliases-recursive-anonymous)

```ts
interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

export type MyAlias = MyObject;
```


## [type-aliases-recursive-export](./test/programs/type-aliases-recursive-export)

```ts
export interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

export type MyAlias = MyObject;
```


## [type-aliases-recursive-object-topref](./test/programs/type-aliases-recursive-object-topref)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [type-aliases-tuple](./test/programs/type-aliases-tuple)

```ts
export type MyTuple = [string, number];
```


## [type-aliases-tuple-of-variable-length](./test/programs/type-aliases-tuple-of-variable-length)

```ts
export type MyTuple = [string, number, boolean?];
```


## [type-aliases-tuple-with-rest-element](./test/programs/type-aliases-tuple-with-rest-element)

```ts
export type MyTuple = [string, ...number[]];
```


## [type-aliases-union](./test/programs/type-aliases-union)

```ts

type BasicArray = (string | number)[];

export interface MyObject {
    array: BasicArray;
}

export type MyUnion = (string | MyObject)[];
```


## [type-aliases-union-namespace](./test/programs/type-aliases-union-namespace)

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


## [type-anonymous](./test/programs/type-anonymous)

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


## [type-default-number-as-integer](./test/programs/type-default-number-as-integer)

```ts
interface MyObject {
    as_integer: number;

    /** @TJS-type number */
    as_number: number;
}
```


## [type-function](./test/programs/type-function)

```ts
interface MyObject {
    myFunction: Function;
}
```


## [type-globalThis](./test/programs/type-globalThis)

```ts
export type Test = typeof globalThis;
```


## [type-intersection](./test/programs/type-intersection)

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


## [type-intersection-recursive](./test/programs/type-intersection-recursive)

```ts
interface ChildFoo {
}

interface Foo {
    readonly childFoos: Foo & ChildFoo;
}
```


## [type-mapped-types](./test/programs/type-mapped-types)

```ts
type Keys = "str1" | "str2";

type MyMappedType = {
  [key in Keys]: string;
};
```


## [type-no-aliases-recursive-topref](./test/programs/type-no-aliases-recursive-topref)

```ts

interface MyObject {
    alias: MyAlias;
    self: MyObject;
}

type MyAlias = MyObject;
```


## [type-nullable](./test/programs/type-nullable)

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


## [type-primitives](./test/programs/type-primitives)

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


## [type-recursive](./test/programs/type-recursive)

```ts
/**
 * A recursive type
 */
export type TestChildren = TestChild | Array<TestChild | TestChildren>;

interface TestChild {
    type: string;
}
```


## [type-union](./test/programs/type-union)

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


## [type-union-tagged](./test/programs/type-union-tagged)

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


## [typeof-keyword](./test/programs/typeof-keyword)

```ts
interface MyObject {
  foo: () => string;
}
```


## [unique-names](./test/programs/unique-names)

```ts
import "./other";

class MyObject {
  is: "MyObject_1";
}
```


## [unique-names](./test/programs/unique-names)

```ts
class MyObject {
  is: "MyObject_2";
}
```


## [unique-names-multiple-subdefinitions](./test/programs/unique-names-multiple-subdefinitions)

```ts
import "./other";

class SubObject {
  is: "SubObject_1";
}

class MyObject {
  sub: SubObject;
}
```


## [unique-names-multiple-subdefinitions](./test/programs/unique-names-multiple-subdefinitions)

```ts
class SubObject {
  is: "SubObject_2";
}
```


## [user-symbols](./test/programs/user-symbols)

```ts
export interface Context {
  ip: string;
}
```


## [user-validation-keywords](./test/programs/user-validation-keywords)

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


