/// <reference path="misc/dimension.ts"/>

interface Product {
    /**
     * Uniquely defines the product
     * @pattern [A-Z][a-z][0-9]_
     */
    name: string;

    /** How big it is */
    dimension?: Dimension;

    /** Classification */
    category: Category;
}

interface WeightedProduct extends Product {
    weight: number;
}

interface Category {
    /** Uniquely identifies the category */
    name: string | number;

    /** Classification level from 1 to 5 (highest)
     * @type integer
     */
    level: number;
}
