import {
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";
import { Error } from "../../errors/Error";
import { searchPageComponent } from "./common/searchPageComponent";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { SharePage } from "../../enum/modals/SharePage";
import { Block, TextObjectType } from "@rocket.chat/ui-kit";
import { getConnectPreview } from "../helper/getConnectLayout";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { searchDatabaseComponent } from "./common/searchDatabaseComponent";
import { SearchDatabaseComponent } from "../../enum/modals/common/SearchDatabaseComponent";
import { NotionTable } from "../../enum/modals/NotionTable";

export async function viewNotionTableModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo
): Promise<IUIKitSurfaceViewParam | Error> {
    const blocks: Block[] = [];
    const { elementBuilder } = app.getUtils();
    const connectBlock = getConnectPreview(app.getID(), tokenInfo);
    blocks.push(connectBlock);

    const searchForDatabaseComponent = await searchDatabaseComponent(
        app,
        modalInteraction,
        tokenInfo,
        NotionTable.ACTION_ID
    );

    if (searchForDatabaseComponent instanceof Error) {
        return searchForDatabaseComponent;
    }

    blocks.push(searchForDatabaseComponent);

    const submit = elementBuilder.addButton(
        { text: NotionTable.VIEW, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionTable.VIEW_ACTION,
            blockId: NotionTable.VIEW_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionTable.CANCEL, style: ButtonStyle.DANGER },
        {
            actionId: NotionTable.CANCEL_ACTION,
            blockId: NotionTable.CANCEL_BLOCK,
        }
    );

    return {
        id: NotionTable.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionTable.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
