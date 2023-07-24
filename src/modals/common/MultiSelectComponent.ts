import { NotionApp } from "../../../NotionApp";
import { ElementInteractionParam } from "../../../definition/ui-kit/Element/IElementBuilder";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";

export function MultiSelectComponent(
    {
        app,
        placeholder,
        options,
        label,
    }: {
        app: NotionApp;
        placeholder: string;
        options: StaticSelectOptionsParam;
        label: string;
    },
    { blockId, actionId }: ElementInteractionParam
) {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const multiSelect = elementBuilder.createMultiStaticSelect(
        { text: placeholder, options: dropDownOption },
        { blockId, actionId }
    );

    const inputBlock = blockBuilder.createInputBlock({
        text: label,
        element: multiSelect,
        optional: false,
    });

    return inputBlock;
}
