import {
    ButtonElement,
    ImageElement,
    StaticSelectElement,
    PlainTextInputElement,
    OverflowElement,
    Option,
    DatePickerElement,
    MultiStaticSelectElement,
} from "@rocket.chat/ui-kit";
import { ButtonParam } from "./IButtonElement";
import { ImageParam } from "./IImageElement";
import {
    StaticSelectElementParam,
    StaticSelectOptionsParam,
} from "./IStaticSelectElement";
import { PlainTextInputParam } from "./IPlainTextInputElement";
import { OverflowElementParam } from "./IOverflowElement";
import { DatePickerElementParam } from "./IDatePickerElement";
import { MultiStaticSelectElementParam } from "./IMultiStaticSelectElement";

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
    createPlainTextInput(
        param: PlainTextInputParam,
        interaction: ElementInteractionParam
    ): PlainTextInputElement;
    createOverflow(
        param: OverflowElementParam,
        interaction: ElementInteractionParam
    ): OverflowElement;
    createDatePicker(
        param: DatePickerElementParam,
        interaction: ElementInteractionParam
    ): DatePickerElement;
    createMultiStaticSelect(
        param: MultiStaticSelectElementParam,
        interaction: ElementInteractionParam
    ): MultiStaticSelectElement;
}

export type ElementInteractionParam = { blockId: string; actionId: string };
