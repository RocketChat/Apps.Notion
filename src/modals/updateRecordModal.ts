import {
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { TextObjectType, Block } from "@rocket.chat/ui-kit";
import { Error } from "../../errors/Error";
import { NotionApp } from "../../NotionApp";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { getConnectPreview } from "../helper/getConnectLayout";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { searchDatabaseComponent } from "./common/searchDatabaseComponent";
import { NotionUpdateRecord } from "../../enum/modals/NotionUpdateRecord";
import { IDatabase } from "../../definition/lib/INotion";

export async function updateRecordModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    parent?: IDatabase
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const divider = blockBuilder.createDividerBlock();
    const connectBlock = getConnectPreview(app.getID(), tokenInfo);

    const searchForDatabaseComponent = await searchDatabaseComponent(
        app,
        modalInteraction,
        tokenInfo,
        NotionUpdateRecord.SEARCH_DB_ACTION_ID
    );

    if (searchForDatabaseComponent instanceof Error) {
        return searchForDatabaseComponent;
    }

    const blocks: Block[] = [connectBlock, searchForDatabaseComponent];

    const submit = elementBuilder.addButton(
        { text: NotionUpdateRecord.UPDATE_RECORD, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionUpdateRecord.UPDATE_RECORD_ACTION,
            blockId: NotionUpdateRecord.UPDATE_RECORD_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionUpdateRecord.CLOSE, style: ButtonStyle.DANGER },
        {
            actionId: NotionUpdateRecord.CLOSE_ACTION,
            blockId: NotionUpdateRecord.CLOSE_BLOCK,
        }
    );


    if (parent) {
        app.getLogger().debug(parent);
        // Handle fetching record of DB and UI Changes
    }

    return {
        id: NotionUpdateRecord.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionUpdateRecord.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
