import { ImageParam } from "../Element/IImageElement";
import { ImageElement } from "@rocket.chat/ui-kit";

export type ContextBlockParam = {
    contextElements: Array<string | ImageElement>;
    blockId?: string;
};
