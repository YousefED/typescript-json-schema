type Keys = "str1" | "str2";

type MyMappedType = {
  [key in Keys]: string;
};
