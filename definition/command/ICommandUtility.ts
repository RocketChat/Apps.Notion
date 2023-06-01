import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";

export interface ICommandUtility {
    app: NotionApp;
    context: SlashCommandContext;
    params: Array<string>;
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string;
    threadId?: string;

    resolveCommand(): Promise<void>;
}

export interface ICommandUtilityParams {
    context: SlashCommandContext;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    app: NotionApp;
}
