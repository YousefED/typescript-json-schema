export type MyExportString = string;
type MyPrivateString = string;

export interface MyObject {
    export: MyExportString;
    private: MyPrivateString;
}
