import { NotionApp } from "../../../NotionApp";
import { InputBlock } from "@rocket.chat/ui-kit";
import { Error } from "../../../errors/Error";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { ModalInteractionStorage } from "../../storage/ModalInteraction";
import { IDatabase } from "../../../definition/lib/INotion";
import { ITokenInfo } from "../../../definition/authorization/IOAuth2Storage";
import { Modals } from "../../../enum/modals/common/Modals";
import { NotionObjectTypes } from "../../../enum/Notion";
import { SearchDatabaseComponent } from "../../../enum/modals/common/SearchDatabaseComponent";
export async function searchDatabaseComponent(
    app: NotionApp,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    actionId: string
): Promise<InputBlock | Error> {
    const { NotionSdk, elementBuilder, blockBuilder } = app.getUtils();
    const { access_token, workspace_id } = tokenInfo;
    let Databases;
    Databases = await modalInteraction.getPagesOrDatabase(workspace_id);
    if (!Databases) {
        Databases = await NotionSdk.searchDatabases(access_token);
        if (Databases instanceof Error) {
            return Databases;
        }

        await modalInteraction.storePagesOrDatabase(Databases, workspace_id);
    }
    const accesibleDatabase: Array<IDatabase> = Databases;

    const options: StaticSelectOptionsParam = accesibleDatabase.map((item) => {
        const info = NotionObjectTypes.INFO.toString();
        const name = NotionObjectTypes.NAME.toString();

        const text: string = item?.[info]?.[name];
        const value = JSON.stringify(item);

        return {
            text,
            value,
        };
    });

    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const dropDown = elementBuilder.addDropDown(
        {
            placeholder: SearchDatabaseComponent.PLACEHOLDER,
            options: dropDownOption,
            dispatchActionConfig: [Modals.dispatchActionConfigOnSelect],
        },
        { blockId: SearchDatabaseComponent.BLOCK_ID, actionId }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text: SearchDatabaseComponent.LABEL,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
