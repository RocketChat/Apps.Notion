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
import { searchRecordComponent } from "./common/searchRecordComponent";
import { NotionUpdateRecord } from "../../enum/modals/NotionUpdateRecord";
import { IDatabase } from "../../definition/lib/INotion";
import { getSelectDatabaseLayout } from "../helper/getSelectDatabaseLayout";

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
    const appId = app.getID();

    const searchForDatabaseComponent = await searchDatabaseComponent(
        app,
        modalInteraction,
        tokenInfo,
        NotionUpdateRecord.SEARCH_DB_ACTION_ID
    );

    if (searchForDatabaseComponent instanceof Error) {
        return searchForDatabaseComponent;
    }

    const blocks: Block[] = [];
    if (!parent) {
        const connectBlock = getConnectPreview(app.getID(), tokenInfo);
        blocks.push(connectBlock);
    }
    blocks.push(searchForDatabaseComponent);

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
        const { info } = parent;
        const SelectedDatabaseLayout = getSelectDatabaseLayout(
            appId,
            tokenInfo,
            info
        );
        blocks.push(SelectedDatabaseLayout);
        let properties = await modalInteraction.getInputElementState(
            NotionUpdateRecord.SEARCH_DB_ACTION_ID
        );
        const searchForRecordComponent = await searchRecordComponent(
            app,
            modalInteraction,
            tokenInfo,
            properties,
            parent,
            NotionUpdateRecord.SEARCH_DB_ACTION_ID
        );

        if (!(searchForRecordComponent instanceof Error))
            blocks.push(searchForRecordComponent);
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
