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