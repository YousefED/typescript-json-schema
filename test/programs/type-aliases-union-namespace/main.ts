
export namespace Cardinal {
    export const NORTH: "north" = "north";
    export const SOUTH: "south" = "south";
    export const EAST: "east" = "east";
    export const WEST: "west" = "west";
}

export type Cardinal = typeof Cardinal.NORTH | typeof Cardinal.SOUTH | typeof Cardinal.EAST | typeof Cardinal.WEST;

export interface MyModel {
    direction: Cardinal;
}
