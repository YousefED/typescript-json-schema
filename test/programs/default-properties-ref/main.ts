
const defaultBooleanFalse = false;
const defaultBooleanTrue = true;
const defaultFloat = 12.3;
const defaultInteger = 123;
const defaultString = "test"

enum FruitEnum {
    Apple = 'apple',
    Orange = 'orange'
}

class MyObject {
    propBooleanFalse: boolean = defaultBooleanFalse;
    propBooleanTrue: boolean = defaultBooleanTrue;
    propFloat: number = defaultFloat;
    propInteger: number = defaultInteger;
    propString: string = defaultString;
    propEnum: FruitEnum = FruitEnum.Apple;
}
