import { NotionApp } from "../../../NotionApp";
import { InputBlock } from "@rocket.chat/ui-kit";
import { Error } from "../../../errors/Error";
import { StaticSelectOptionsParam } from "../../../definition/ui-kit/Element/IStaticSelectElement";
import { ModalInteractionStorage } from "../../storage/ModalInteraction";
import { IDatabase } from "../../../definition/lib/INotion";
import { ITokenInfo } from "../../../definition/authorization/IOAuth2Storage";
import { Modals } from "../../../enum/modals/common/Modals";
import { NotionObjectTypes } from "../../../enum/Notion";
import { SearchRecordComponent } from "../../../enum/modals/common/SearchRecordComponent";
export async function searchRecordComponent(
    app: NotionApp,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    properties: any,
    database: IDatabase,
    actionId: string
): Promise<InputBlock | Error> {
    const { NotionSdk, elementBuilder, blockBuilder } = app.getUtils();
    const { access_token, workspace_id } = tokenInfo;
    let Records;
    let recordTitles: string[] = [];
    if (!Records) {
        let databaseTitle;
        const columns = Object.keys(properties);
        const firstColumn = columns[0];
        const lastColumn = columns[columns.length - 1];

        if (properties[firstColumn]?.type == NotionObjectTypes.TITLE) {
            databaseTitle = firstColumn;
        } else {
            databaseTitle = lastColumn;
        }

        const database_id = database.parent.database_id;
        const response = await NotionSdk.queryDatabasePages(
            access_token,
            database_id
        );
       
        const databaseTitleIndex: number = response[0].findIndex(
            (title) => title === databaseTitle
        );

        if (databaseTitleIndex !== -1) {
            if (!(response instanceof Error)) {
                for (let i = 1; i < response.length; i++) {
                    recordTitles.push(response[i][databaseTitleIndex]);
                }
            }
        }

        console

        if (Records instanceof Error) {
            return Records;
        }
    }

    const options: StaticSelectOptionsParam = recordTitles.map((item) => {
        const text: string = item;
        const value = JSON.stringify(item);

        return {
            text,
            value,
        };
    });

    const dropDownOption = elementBuilder.createDropDownOptions(options);
    const dropDown = elementBuilder.addDropDown(
        {
            placeholder: SearchRecordComponent.PLACEHOLDER,
            options: dropDownOption,
            dispatchActionConfig: [Modals.dispatchActionConfigOnSelect],
        },
        { blockId: SearchRecordComponent.BLOCK_ID, actionId }
    );
    const inputBlock = blockBuilder.createInputBlock({
        text: SearchRecordComponent.LABEL,
        element: dropDown,
        optional: false,
    });

    return inputBlock;
}
