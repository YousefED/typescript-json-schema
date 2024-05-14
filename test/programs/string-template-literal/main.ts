interface MyObject {
  a: `@${string}`,
  b: `@${number}`,
  c: `@${bigint}`,
  d: `@${boolean}`,
  e: `@${undefined}`,
  f: `@${null}`,
  g: `${string}@`,
  h: `${number}@`,
  i: `${string}@${number}`,
  j: `${string}.${string}`,
}