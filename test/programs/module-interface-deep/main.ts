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
