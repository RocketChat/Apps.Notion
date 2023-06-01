import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IOAuth2Client } from "../../definition/authorization/IOAuthClient";

export class OAuth2Client implements IOAuth2Client {
    constructor(private readonly app: NotionApp) {}
    public async connect(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {}

    public async disconnect(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ) {}

    private async getCredentials(read: IRead) {}
}
