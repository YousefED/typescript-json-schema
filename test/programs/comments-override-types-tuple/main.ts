/**
 * An integer greater than one
 * @type integer
 * @minimum 1
 */
export type PositiveInteger = number;

export interface Container {
    /**
     * @maxLength 10
     */
    value: string
}

export interface MyTuple {
   tup: [ PositiveInteger, Container ];
}
