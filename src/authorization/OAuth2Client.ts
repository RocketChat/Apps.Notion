import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IOAuth2Client } from "../../definition/authorization/IOAuthClient";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { OAuth2Storage } from "./OAuth2Storage";
import { sendNotification, sendNotificationWithBlock } from "../helper/message";
import { getCredentials } from "../helper/getCredential";
import { OAuth2Content, OAuth2Credential, OAuth2Locator } from "../../enum/OAuth2";
import { URL } from "url";
import { getActionBlock, getConnectBlock, getTextBlock } from "../helper/getConnectBlock";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export class OAuth2Client implements IOAuth2Client {
    constructor(private readonly app: NotionApp) {}
    public async connect(
        room: IRoom,
        sender: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {
        const { blockBuilder, elementBuilder } = this.app.getUtils();
        const authorizationUrl = await this.getAuthorizationUrl(
            sender,
            read,
            modify,
            room
        );

        if (!authorizationUrl) {
            return;
        }

        const message = `Hey **${sender.username}**!👋 Connect your Notion Workspace`;
        // const blocks = await getConnectBlock(
        //     this.app,
        //     message,
        //     authorizationUrl
        // );

        const textBlock = await getTextBlock(this.app, message);

        const actionBlock = await getActionBlock(this.app, authorizationUrl);

        await sendNotificationWithBlock(read, modify, sender, room, authorizationUrl, {
            message,
            blocks: actionBlock
        });
    }

    public async disconnect(
        room: IRoom,
        sender: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {
        const persistenceRead = read.getPersistenceReader();
        const oAuthStorage = new OAuth2Storage(persis, persistenceRead);
        const { blockBuilder, elementBuilder } = this.app.getUtils();

        const userId = sender.id;
        const tokenInfo = await oAuthStorage.getCurrentWorkspace(userId);

        if (tokenInfo) {
            await oAuthStorage.disconnectUserFromCurrentWorkspace(userId);
            const message = `👋 You are disconnected from the Workspace **${tokenInfo.workspace_name}**`;
            await sendNotification(read, modify, sender, room, { message });
            return;
        }

        const authorizationUrl = await this.getAuthorizationUrl(
            sender,
            read,
            modify,
            room
        );

        if (!authorizationUrl) {
            return;
        }

        const message = OAuth2Content.NOT_CONNECTED_MESSAGE;
        const blocks = await getConnectBlock(
            this.app,
            message,
            authorizationUrl
        );
        await sendNotification(read, modify, sender, room, {
            blocks,
        });
    }

    public async getAuthorizationUrl(
        user: IUser,
        read: IRead,
        modify: IModify,
        room: IRoom
    ): Promise<string | null> {
        const userId = user.id;
        const credentials = await getCredentials(read, modify, user, room);

        if (!credentials) {
            return null;
        }

        const { clientId, siteUrl } = credentials;

        const redirectUrl = new URL(OAuth2Locator.redirectUrlPath, siteUrl);
        const authorizationUrl = new URL(OAuth2Locator.authUri);
        authorizationUrl.searchParams.set(OAuth2Credential.CLIENT_ID, clientId);
        authorizationUrl.searchParams.set(
            OAuth2Credential.REDIRECT_URI,
            redirectUrl.toString()
        );
        authorizationUrl.searchParams.set(OAuth2Credential.STATE, userId);

        return authorizationUrl.toString();
    }
}
