export namespace Types {
  export const X: "x" = "x";
  export const Y: "y" = "y";
}

export type Type = typeof Types.X | typeof Types.Y;
