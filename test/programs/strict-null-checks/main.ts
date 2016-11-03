
class MyObject {
     val: number;
     valNullable: number | null;
     valUndef: number | undefined;
     valOpt?: number;

     valTrueOpt?: true;
     valTrueOrNull: true|null;
     valTrue: true|true; // twice to check that it will appear only once
}
