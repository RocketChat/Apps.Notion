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
import { NotionPage } from "../../enum/modals/NotionPage";

export async function viewNotionPageModal(
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
        NotionPage.ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    blocks.push(searchForPageComponent);

    const submit = elementBuilder.addButton(
        { text: NotionPage.VIEW, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionPage.VIEW_ACTION,
            blockId: NotionPage.VIEW_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionPage.CANCEL, style: ButtonStyle.DANGER },
        {
            actionId: NotionPage.CANCEL_ACTION,
            blockId: NotionPage.CANCEL_BLOCK,
        }
    );

    return {
        id: NotionPage.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionPage.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
