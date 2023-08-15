import { NotionApp } from "../../../NotionApp";
import { ElementInteractionParam } from "../../../definition/ui-kit/Element/IElementBuilder";
import { StaticSelectElementParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { Modals } from "../../../enum/modals/common/Modals";

export async function OverflowMenuComponent(
    {
        app,
        text,
        value,
        url,
    }: {
        app: NotionApp;
        text: string[];
        value: string[];
        url?: string[];
    },
    interaction: ElementInteractionParam
) {
    // assuming text and value are of same length

    const { elementBuilder, blockBuilder } = app.getUtils();

    const optionParams = text.map((item, index) => {
        return {
            text: item,
            value: value[index],
            url: url ? url[index] : undefined,
        };
    });

    const options = elementBuilder.createDropDownOptions(optionParams);

    const overflowMenu = elementBuilder.createOverflow(
        { options },
        interaction
    );

    const sectionBlock = blockBuilder.createSectionBlock({
        accessory: overflowMenu,
    });

    return sectionBlock;
}
