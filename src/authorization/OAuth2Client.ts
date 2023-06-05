import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IOAuth2Client } from "../../definition/authorization/IOAuthClient";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { sendNotification } from "../helper/message";
import { getCredentials } from "../helper/getCredential";
import { OAuth2Credential, OAuth2Locator } from "../../enum/OAuth2";
import { URL } from "url";
import { getConnectBlock } from "../helper/getConnectBlock";

export class OAuth2Client implements IOAuth2Client {
    constructor(private readonly app: NotionApp) {}
    public async connect(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {
        const { blockBuilder, elementBuilder } = this.app.getUtils();
        const user = context.getSender();
        const room = context.getRoom();
        const authorizationUrl = await this.getAuthorizationUrl(user, read);
        const message = `Hey👋 ${user.username}!`;
        const blocks = await getConnectBlock(
            this.app,
            message,
            authorizationUrl
        );

        await sendNotification(read, modify, user, room, {
            blocks,
        });
    }

    public async disconnect(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {}

    public async getAuthorizationUrl(
        user: IUser,
        read: IRead
    ): Promise<string> {
        const userId = user.id;
        const { clientId, siteUrl } = await getCredentials(read);

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
