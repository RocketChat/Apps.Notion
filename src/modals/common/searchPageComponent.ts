import { NotionApp } from "../../../NotionApp";
import { InputBlock } from "@rocket.chat/ui-kit";
import { Error } from "../../../errors/Error";
import { SearchPage } from "../../../enum/modals/common/SearchPageComponent";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
export async function searchPageComponent(
    app: NotionApp,
    token: string
): Promise<InputBlock | Error> {
    const { NotionSdk, elementBuilder, blockBuilder } = app.getUtils();
    const response = await NotionSdk.searchPages(token);

    if (response instanceof Error) {
        return response;
    }

    const accesiblePages = response;
    const options: StaticSelectOptionsParam = accesiblePages.map((page) => {
        const text = page.name;
        const value = page.parent.page_id;
        return {
            text,
            value,
        };
    });
    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const dropDown = elementBuilder.addDropDown(
        { placeholder: SearchPage.PLACEHOLDER, options: dropDownOption },
        { blockId: SearchPage.BLOCK_ID, actionId: SearchPage.ACTION_ID }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text: SearchPage.LABEL,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
