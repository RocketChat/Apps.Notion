import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { ButtonElement, ImageElement } from "@rocket.chat/ui-kit";
import { ButtonParam } from "./IButtonElement";
import { ImageParam } from "./IImageElement";

export interface IElementBuilder {
    addButton(
        param: ButtonParam,
        interaction: ElementInteractionParam
    ): ButtonElement;
    addImage(param: ImageParam): ImageElement;
}

export type ElementInteractionParam = { blockId: string; actionId: string };
