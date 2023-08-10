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
import { Block, TextObjectType } from "@rocket.chat/ui-kit";
import { getConnectPreview } from "../helper/getConnectLayout";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { SendMessagePage } from "../../enum/modals/SendMessagePage";

export async function sendMessagePageModal(
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

    const searchForPageComponent = await searchPageComponent(
        app,
        modalInteraction,
        tokenInfo,
        SendMessagePage.ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    blocks.push(searchForPageComponent);

    const submit = elementBuilder.addButton(
        { text: SendMessagePage.SEND, style: ButtonStyle.PRIMARY },
        {
            actionId: SendMessagePage.SEND_ACTION,
            blockId: SendMessagePage.SEND_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: SendMessagePage.CANCEL, style: ButtonStyle.DANGER },
        {
            actionId: SendMessagePage.CANCEL_ACTION,
            blockId: SendMessagePage.CANCEL_BLOCK,
        }
    );

    return {
        id: SendMessagePage.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: SendMessagePage.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
