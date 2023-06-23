import { NotionApp } from "../../../NotionApp";
import { InputBlock } from "@rocket.chat/ui-kit";
import { Error } from "../../../errors/Error";
import { SearchPage } from "../../../enum/modals/common/SearchPageComponent";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { ModalInteractionStorage } from "../../storage/ModalInteraction";
import { IPage } from "../../../definition/lib/INotion";
import { ITokenInfo } from "../../../definition/authorization/IOAuth2Storage";
export async function searchPageComponent(
    app: NotionApp,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo
): Promise<InputBlock | Error> {
    const { NotionSdk, elementBuilder, blockBuilder } = app.getUtils();
    const { access_token, workspace_id } = tokenInfo;
    let pagesOrDatabases;
    pagesOrDatabases = await modalInteraction.getPagesOrDatabase(workspace_id);
    if (!pagesOrDatabases) {
        pagesOrDatabases = await NotionSdk.searchPages(access_token);
        if (pagesOrDatabases instanceof Error) {
            return pagesOrDatabases;
        }

        await modalInteraction.storePagesOrDatabase(pagesOrDatabases, workspace_id);
    }

    const accesiblePages: Array<IPage> = pagesOrDatabases;
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
