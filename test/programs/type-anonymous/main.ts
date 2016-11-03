 interface MyObject {
    FieldWithAnonType: {
        SubfieldA: number;
        SubfieldB: (string | number);
        SubfieldC: {
            SubsubfieldA: number[];
        }
    };
}
