import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Block } from "@rocket.chat/ui-kit";
import { NotionApp } from "../../NotionApp";
import { OAuth2Content } from "../../enum/OAuth2";
import { getConnectBlock } from "./getConnectBlock";
import { IMessageAttachmentField } from "@rocket.chat/apps-engine/definition/messages";
import { Messages, OnInstallContent } from "../../enum/messages";
import { IMessageAttachment } from "@rocket.chat/apps-engine/definition/messages";
import { getOrCreateDirectRoom } from "./getOrCreateDirectRoom";
import { BlockBuilder } from "../lib/BlockBuilder";

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

export async function sendHelperNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const attachment: IMessageAttachment = {
        color: "#000000",
        text: Messages.HELPER_COMMANDS,
    };

    const helperMessage = modify
        .getCreator()
        .startMessage()
        .setRoom(room)
        .setSender(appUser)
        .setText(Messages.HELPER_TEXT)
        .setAttachments([attachment])
        .setGroupable(false);

    return read.getNotifier().notifyUser(user, helperMessage.getMessage());
}

export async function sendHelperMessageOnInstall(
    appId: string,
    user: IUser,
    read: IRead,
    modify: IModify,
    http?: IHttp,
    persistence?: IPersistence
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const members = [user.username, appUser.username];

    const room = await getOrCreateDirectRoom(read, modify, members);
    const blockBuilder = new BlockBuilder(appId);
    const title = [OnInstallContent.PREVIEW_TITLE.toString()];
    const description = [OnInstallContent.PREVIEW_DESCRIPTION.toString()];
    const contextElements = [OnInstallContent.PREVIEW_CONTEXT.toString()];
    const footer = blockBuilder.createContextBlock({
        contextElements: contextElements,
    });
    const thumb = {
        url: OnInstallContent.PREVIEW_IMAGE.toString(),
    };

    const installationPreview = blockBuilder.createPreviewBlock({
        title,
        description,
        footer,
        thumb,
    });
    const text = ` 🙌 Hey **${
        user.username
    }** ! ${OnInstallContent.WELCOME_TEXT.toString()}`;


    const combinedText = `${text} ${OnInstallContent.WELCOMING_MESSAGE.toString()}`;

    const previewBuilder = modify
        .getCreator()
        .startMessage()
        .setRoom(room)
        .setSender(appUser)
        .setGroupable(false)
        .setBlocks([installationPreview])
        .setParseUrls(true);

    const textMessageBuilder = modify
        .getCreator()
        .startMessage()
        .setRoom(room)
        .setSender(appUser)
        .setGroupable(true)
        .setParseUrls(false)
        .setText(combinedText);

    await modify.getCreator().finish(previewBuilder);
    await modify.getCreator().finish(textMessageBuilder);
}

export async function sendMessageWithAttachments(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    content: {
        message?: string;
        blocks?: Array<Block>;
        fields: Array<IMessageAttachmentField>;
    }
): Promise<string> {
    const { message, blocks, fields } = content;
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(user)
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

    return await modify.getCreator().finish(messageBuilder);
}

export async function sendMessage(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    content: { message?: string; blocks?: Array<Block> },
    threadId?: string,
    attachment?: IMessageAttachment
): Promise<void> {
    const { message, blocks } = content;
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(user)
        .setRoom(room)
        .setGroupable(false)
        .setParseUrls(true);

    if (message) {
        messageBuilder.setText(message);
    } else if (blocks) {
        messageBuilder.setBlocks(blocks);
    }

    if (threadId) {
        messageBuilder.setThreadId(threadId);
    }

    if (attachment) {
        messageBuilder.addAttachment(attachment);
    }

    await modify.getCreator().finish(messageBuilder);
    return;
}