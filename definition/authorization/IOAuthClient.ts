import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export interface IOAuth2Client {
    connect(
        room: IRoom,
        sender: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void>;

    disconnect(
        room: IRoom,
        sender: IUser,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void>;

    getAuthorizationUrl(user: IUser, read: IRead): Promise<string>;
}
