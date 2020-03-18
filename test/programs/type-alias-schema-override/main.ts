interface All {}

type Some = Partial<All>;

interface MyObject {
  some?: Some;
}
