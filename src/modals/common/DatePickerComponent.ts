import { NotionApp } from "../../../NotionApp";
import { ElementInteractionParam } from "../../../definition/ui-kit/Element/IElementBuilder";

export function DatePickerComponent(
    { app, label }: { app: NotionApp; label: string },
    { blockId, actionId }: ElementInteractionParam
) {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const datePickerElement = elementBuilder.createDatePicker(
        {},
        { blockId, actionId }
    );

    const inputBlock = blockBuilder.createInputBlock({
        text: label,
        element: datePickerElement,
        optional: false,
    });

    return inputBlock;
}
