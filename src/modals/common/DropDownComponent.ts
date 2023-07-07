import { NotionApp } from "../../../NotionApp";
import { ElementInteractionParam } from "../../../definition/ui-kit/Element/IElementBuilder";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { Modals } from "../../../enum/modals/common/Modals";
import { InputElementDispatchAction } from "@rocket.chat/ui-kit";

export function DropDownComponent(
    {
        app,
        options,
        placeholder,
        text,
        dispatchActionConfigOnSelect,
        dispatchActionConfigOnInput,
    }: {
        app: NotionApp;
        options: StaticSelectOptionsParam;
        placeholder: string;
        text: string;
        dispatchActionConfigOnSelect?: boolean;
        dispatchActionConfigOnInput?: boolean;
    },
    { blockId, actionId }: ElementInteractionParam
) {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const dropDownOption = elementBuilder.createDropDownOptions(options);

    let dispatchActionConfig: Array<InputElementDispatchAction> = [];

    if (dispatchActionConfigOnSelect) {
        dispatchActionConfig.push(Modals.dispatchActionConfigOnSelect);
    }

    if (dispatchActionConfigOnInput) {
        dispatchActionConfig.push(Modals.dispatchActionConfigOnInput);
    }

    const dropDown = elementBuilder.addDropDown(
        {
            placeholder,
            options: dropDownOption,
            dispatchActionConfig,
        },
        { blockId, actionId }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
