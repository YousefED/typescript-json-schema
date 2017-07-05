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
