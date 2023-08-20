import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";
import {
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionWorkspace } from "../../enum/modals/NotionWorkspace";
import { Block, TextObjectType } from "@rocket.chat/ui-kit";
import { getConnectPreview } from "../helper/getConnectLayout";
import { DropDownComponent } from "./common/DropDownComponent";
import { StaticSelectOptionsParam } from "../../definition/ui-kit/Element/IStaticSelectElement";
import { OAuth2Storage } from "../authorization/OAuth2Storage";

export async function changeWorkspaceModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo
): Promise<IUIKitSurfaceViewParam> {
    const { elementBuilder } = app.getUtils();
    const blocks: Block[] = [];
    const options: StaticSelectOptionsParam = [];

    const connectBlock = getConnectPreview(app.getID(), tokenInfo);
    blocks.push(connectBlock);

    const persistenceRead = read.getPersistenceReader();
    const oAuth2Storage = new OAuth2Storage(persistence, persistenceRead);
    const workspaces = (await oAuth2Storage.getAllConnectedWorkspaces(
        user.id
    )) as ITokenInfo[];

    workspaces.forEach((workspace) => {
        options.push({
            text: workspace.workspace_name as string,
            value: JSON.stringify(workspace),
        });
    });

    const changeWorkspaceDropDown = DropDownComponent(
        {
            app,
            options,
            placeholder: NotionWorkspace.CHANGE_WORKSPACE_PLACEHOLDER,
            text: NotionWorkspace.CHANGE_WORKSPACE_TEXT,
            dispatchActionConfigOnSelect: true,
            initialValue: JSON.stringify(tokenInfo),
        },
        {
            blockId: NotionWorkspace.CHANGE_WORKSPACE_BLOCK,
            actionId: NotionWorkspace.CHANGE_WORKSPACE_ACTION,
        }
    );

    blocks.push(changeWorkspaceDropDown);

    const submit = elementBuilder.addButton(
        { text: NotionWorkspace.SELECT, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionWorkspace.SELECT_ACTION,
            blockId: NotionWorkspace.SELECT_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionWorkspace.CANCEL, style: ButtonStyle.DANGER },
        {
            actionId: NotionWorkspace.CANCEL_ACTION,
            blockId: NotionWorkspace.CANCEL_BLOCK,
        }
    );

    return {
        id: NotionWorkspace.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionWorkspace.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
