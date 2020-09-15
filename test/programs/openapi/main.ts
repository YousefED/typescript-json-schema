type NullableString = string | null;

/** @nullable */
type AnnotatedString = string;

interface ComposedType {
    str: string;
    primitiveUnion: string | number;
    enumPrimitiveUnion: number | "foo" | "bar";
    union: { name: string } | string | number;

    nullableStr: string | null;
    nullablePrimitiveUnion: string | number | null;
    nullableEnumPrimitiveUnion: number | "foo" | "bar" | null;
    nullableUnion: { name: string } | string | number | null;

    /** @nullable */
    annotatedStr: string;
    /** @nullable */
    annotatedPrimitiveUnion: string | number;
    /** @nullable */
    annotatedEnumPrimitiveUnion: number | "foo" | "bar";
    /** @nullable */
    annotatedUnion: { name: string } | string | number;

    externallyAnnotatedString: AnnotatedString;
    externallyNullableString: NullableString;
}
