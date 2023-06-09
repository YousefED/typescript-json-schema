/**
 * Description of InnerObject.
 */
type InnerObject = {
	/**
	 * Description of foo.
	 */
	foo: string;
};

/**
 * Description of MyObject.
 */
type MyObject = {

	inner1?: InnerObject;

	/**
	 * Override description.
	 */
	inner2?: InnerObject;
};
