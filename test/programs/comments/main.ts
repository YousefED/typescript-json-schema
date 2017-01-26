
/**
 * Description of Vector3D, a type alias to a array of integers with length 3
 * If run without useTypeAliasRef, this comment should be ignored but
 * the other annotations should be inherited
 * @minItems 3
 * @maxItems 3
 */
type Vector3D = number[];

/**
 * Description of MyObject, a top level object,
 * which also has a comment that spans
 * multiple lines
 *
 * @additionalProperties false
 * @unsupportedAnnotationThatShouldBeIgnored
 */
interface MyObject {

    /**
     * Description of opacity, a field with min/max values
     * @minimum 0
     * @maximum 100
     */
    opacity: number;

    /**
     * Description of field position, of aliased type Vector3D, which should inherit its annotations
     */
    position: Vector3D;

    /**
     * Description of rotation, a field with an anonymous type
     */
    rotation: {
        /**
         * Description of the value yaw inside an anonymous type, with min/max annotations
         * @minimum -90
         * @maximum 90
         */
        yaw: number;
    };
}
