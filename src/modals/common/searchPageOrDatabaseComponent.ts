import { NotionApp } from "../../../NotionApp";
import { InputBlock } from "@rocket.chat/ui-kit";
import { Error } from "../../../errors/Error";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { ModalInteractionStorage } from "../../storage/ModalInteraction";
import { IDatabase, IPage } from "../../../definition/lib/INotion";
import { ITokenInfo } from "../../../definition/authorization/IOAuth2Storage";
import { Modals } from "../../../enum/modals/common/Modals";
import { SearchPageAndDatabase } from "../../../enum/modals/common/SearchPageAndDatabaseComponent";
import { NotionObjectTypes } from "../../../enum/Notion";
export async function searchPageOrDatabaseComponent(
    app: NotionApp,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    actionId: string
): Promise<InputBlock | Error> {
    const { NotionSdk, elementBuilder, blockBuilder } = app.getUtils();
    const { access_token, workspace_id } = tokenInfo;
    let pagesOrDatabases;
    pagesOrDatabases = await modalInteraction.getPagesOrDatabase(workspace_id);
    if (!pagesOrDatabases) {
        pagesOrDatabases = await NotionSdk.searchPagesAndDatabases(
            access_token
        );
        if (pagesOrDatabases instanceof Error) {
            return pagesOrDatabases;
        }

        await modalInteraction.storePagesOrDatabase(
            pagesOrDatabases,
            workspace_id
        );
    }
    const accesiblePagesAndDatabase: Array<IPage | IDatabase> =
        pagesOrDatabases;

    const options: StaticSelectOptionsParam = accesiblePagesAndDatabase.map(
        (item) => {
            
            const info = NotionObjectTypes.INFO.toString();
            const name = NotionObjectTypes.NAME.toString();

            const text: string = item?.[name] ?? item?.[info]?.[name];
            const value = JSON.stringify(item);

            return {
                text,
                value,
            };
        }
    );

    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const dropDown = elementBuilder.addDropDown(
        {
            placeholder: SearchPageAndDatabase.PLACEHOLDER,
            options: dropDownOption,
            dispatchActionConfig: [Modals.dispatchActionConfigOnSelect],
        },
        { blockId: SearchPageAndDatabase.BLOCK_ID, actionId }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text: SearchPageAndDatabase.LABEL,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
