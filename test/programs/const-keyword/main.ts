const fn = <const T>(value: T) =>
  ({ value });

export type Object = ReturnType<typeof fn<"value">>;
