import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Block } from "@rocket.chat/ui-kit";
import { NotionApp } from "../../NotionApp";
import { OAuth2Content } from "../../enum/OAuth2";
import { getConnectBlock } from "./getConnectBlock";
import { IMessageAttachmentField } from "@rocket.chat/apps-engine/definition/messages";

export async function sendNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    content: { message?: string; blocks?: Array<Block> }
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const { message, blocks } = content;
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setGroupable(false);

    if (message) {
        messageBuilder.setText(message);
    } else if (blocks) {
        messageBuilder.setBlocks(blocks);
    }
    return read.getNotifier().notifyUser(user, messageBuilder.getMessage());
}

export async function sendNotificationWithConnectBlock(
    app: NotionApp,
    user: IUser,
    read: IRead,
    modify: IModify,
    room: IRoom
) {
    const url = await app
        .getOAuth2Client()
        .getAuthorizationUrl(user, read, modify, room);

    if (url) {
        const message = OAuth2Content.NOT_CONNECTED_MESSAGE_WITH_INFO;
        const blocks = await getConnectBlock(app, message, url);

        await sendNotification(read, modify, user, room, {
            blocks: blocks,
        });
    }

    return;
}

export async function sendNotificationWithAttachments(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    content: {
        message?: string;
        blocks?: Array<Block>;
        fields: Array<IMessageAttachmentField>;
    }
) {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const { message, blocks, fields } = content;
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setGroupable(false);

    if (message) {
        messageBuilder.setText(message);
    } else if (blocks) {
        messageBuilder.setBlocks(blocks);
    }

    messageBuilder.setAttachments([
        {
            color: "#000000",
            fields,
        },
    ]);

    return read.getNotifier().notifyUser(user, messageBuilder.getMessage());
}
