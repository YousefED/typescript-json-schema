/// <reference path="../misc/dimension.ts"/>
/// <reference path="../product.ts"/>

/**
 * Represents the document sent to the customer for payment.
 */
interface Invoice {
    /**
     * Who will pay?
     * Not me!
     */
    customer: string;

    /**
     * Invoice content
     * @minItems 1
     * @maxItems 50
     */
    lines: InvoiceLine[];

    dimension: Dimension; // Total dimension of the order

    blob: any; // Additional stuff
}

interface InvoiceLine {

    product: Product;

    /**
     * @minimum 0
     * @exclusiveMinimum true
     * @maximum 10
     * @exclusiveMaximum false
     * @multipleOf 2
     */
    quantity: number;
}
