interface MySubObject {}

interface MyObject {
    /**
     * @$ref http://my-schema.org
     */
    externalRef;

    /**
     * @$ref http://my-schema.org
     */
    externalRefOverride: MySubObject;
}