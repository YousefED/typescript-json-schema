import { Widget } from "./widget";

export interface MyObject {
    name: string;

    mainWidget: Widget;
    otherWidgets: Widget[];
}
