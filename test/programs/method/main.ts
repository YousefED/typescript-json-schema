interface MyObject {
  setTime?<T extends Array<string> & {name: {first: string, last: string}}, T2>(d: {name: string, test: number} | {test: number}, someParam?: T2): Array<T>;
}
