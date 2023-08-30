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

export async function sharePageModal(
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
        SharePage.ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    blocks.push(searchForPageComponent);

    const submit = elementBuilder.addButton(
        { text: SharePage.SHARE, style: ButtonStyle.PRIMARY },
        {
            actionId: SharePage.SHARE_ACTION,
            blockId: SharePage.SHARE_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: SharePage.CLOSE, style: ButtonStyle.DANGER },
        {
            actionId: SharePage.CLOSE_ACTION,
            blockId: SharePage.CLOSE_BLOCK,
        }
    );

    return {
        id: SharePage.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: SharePage.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
