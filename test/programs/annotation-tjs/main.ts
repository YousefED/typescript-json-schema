// All of these formats are defined in this specification: http://json-schema.org/latest/json-schema-validation.html#rfc.section.8.3
interface MyObject {
    /**
     * @TJS-format date-time
     */
    dateTime: string;

    /**
     * @TJS-format email
     */
    email: string;

    /**
     * @TJS-format hostname
     */
    hostname: string;

    /**
     * @TJS-format ipv4
     */
    ipv4: string;

    /**
     * @TJS-format ipv6
     */
    ipv6: string;

    /**
     * @TJS-format uri
     */
    uri: string;

    /**
     * @TJS-format uri-reference
     */
    uriReference: string;

    /**
     * @TJS-format uri-template
     */
    uriTemplate: string;

    /**
     * @TJS-format json-pointer
     */
    jsonPointer: string;

    /**
     * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$
     */
    regexPattern: string;

    /**
     * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$    
     */
    regexPatternWithWhitespace: string;

    /**
     * @TJS-minimum 5
     */
    oneCharacter: number;
}
