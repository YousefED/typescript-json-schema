type MyRecursiveNode = {
    next?: MyNode;
}

type MyNode = {
    val: string;
} & MyRecursiveNode;

type MyLinkedList = MyNode;