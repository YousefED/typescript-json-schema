interface Dictionary<T> {
    [id: string]: T;
}

interface Book {
    title: string;
}

export interface State {
    books: Dictionary<Book>;
    counts: Dictionary<number>;
}
