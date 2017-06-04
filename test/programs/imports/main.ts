
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
