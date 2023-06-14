import { NotionApp } from "../../../NotionApp";
import { ElementInteractionParam } from "../../../definition/ui-kit/Element/IElementBuilder";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";

export function DropDownComponent(
    {
        app,
        options,
        placeholder,
        text,
    }: {
        app: NotionApp;
        options: StaticSelectOptionsParam;
        placeholder: string;
        text: string;
    },
    { blockId, actionId }: ElementInteractionParam
) {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const dropDown = elementBuilder.addDropDown(
        { placeholder, options: dropDownOption },
        { blockId, actionId }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
