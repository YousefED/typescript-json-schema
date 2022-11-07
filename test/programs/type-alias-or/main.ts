interface A {}
interface B {}

type C = A | B;

interface MyObject {
    c: C;
}
