interface Target {
  objAnonymous: {
    [index: number]: number;
  };
  objInterface: IndexInterface;
  indexInType: { [index in number]?: number };
  indexInInline: { [index in number]: number };
  indexInPartialType: IndexInPartial;
  indexInPartialInline: { [index in number]?: number };
}
interface IndexInterface {
  [index: number]: number;
}

type IndexIn = { [index in number]: number };
type IndexInPartial = { [index in number]?: number };
