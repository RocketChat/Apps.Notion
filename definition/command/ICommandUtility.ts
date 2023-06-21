import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";

export interface ICommandUtility {
    app: NotionApp;
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
    app: NotionApp;
    params: Array<string>;
    sender: IUser;
    room: IRoom;
    read: IRead;
    modify: IModify;
    http: IHttp;
    persis: IPersistence;
    triggerId?: string;
    threadId?: string;
}
