type NullableString = string | null;

interface ComposedType {
    str: string;
    primitiveUnion: string | number;
    enumPrimitiveUnion: number | "foo" | "bar";
    union: { name: string } | string | number;

    nullableStr: string | null;
    nullablePrimitiveUnion: string | number | null;
    nullableEnumPrimitiveUnion: number | "foo" | "bar" | null;
    nullableUnion: { name: string } | string | number | null;

    externallyNullableString: NullableString;
}
