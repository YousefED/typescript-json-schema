namespace foo {
  export interface Date {
    day?: number;
    month?: number;
    year?: number;
  }

  export interface Bar {
    date: Date;
  }
}
