import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import {
    ButtonElement,
    ImageElement,
    StaticSelectElement,
    Option,
} from "@rocket.chat/ui-kit";
import { ButtonParam } from "./IButtonElement";
import { ImageParam } from "./IImageElement";
import {
    StaticSelectElementParam,
    StaticSelectOptionsParam,
} from "./IStaticSelectElement";

export interface IElementBuilder {
    addButton(
        param: ButtonParam,
        interaction: ElementInteractionParam
    ): ButtonElement;
    addImage(param: ImageParam): ImageElement;
    addDropDown(
        param: StaticSelectElementParam,
        interaction: ElementInteractionParam
    ): StaticSelectElement;
    createDropDownOptions(param: StaticSelectOptionsParam): Array<Option>;
}

export type ElementInteractionParam = { blockId: string; actionId: string };
