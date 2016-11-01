
export namespace Cardinal {
    export const NORTH: 'north' = 'north';
    export type NORTH = typeof NORTH;
    export const SOUTH: 'south' = 'south';
    export type SOUTH = typeof SOUTH;
    export const EAST: 'east' = 'east';
    export type EAST = typeof EAST;
    export const WEST: 'west' = 'west';
    export type WEST = typeof WEST;
}

export type Cardinal = Cardinal.NORTH | Cardinal.SOUTH | Cardinal.EAST | Cardinal.WEST;

export interface MyModel {
    direction: Cardinal;
}
