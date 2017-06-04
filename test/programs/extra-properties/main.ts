export interface MyObject {
    required: string;
    optional?: number;
    [name: string]: string|number;
}
