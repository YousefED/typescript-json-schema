
class MyObject {
     val: number;
     valNullable: number | null;
     valUndef: undefined;
     valVoid: void;
     valOpt?: number;

     valTrueOpt?: true;
     valTrueOrNull: true|null;
     valTrue: true|true; // twice to check that it will appear only once
}
