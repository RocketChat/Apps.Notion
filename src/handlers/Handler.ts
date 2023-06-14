import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHanderParams, IHandler } from "../../definition/handlers/IHandler";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { NotionApp } from "../../NotionApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";

export class Handler implements IHandler {
    public app: NotionApp;
    public sender: IUser;
    public room: IRoom;
    public read: IRead;
    public modify: IModify;
    public http: IHttp;
    public persis: IPersistence;
    public oAuth2Storage: OAuth2Storage;
    public roomInteractionStorage: RoomInteractionStorage;
    public triggerId?: string;
    public threadId?: string;

    constructor(params: IHanderParams) {
        this.app = params.app;
        this.sender = params.sender;
        this.room = params.room;
        this.read = params.read;
        this.modify = params.modify;
        this.http = params.http;
        this.persis = params.persis;
        this.triggerId = params.triggerId;
        this.threadId = params.threadId;
        const persistenceRead = params.read.getPersistenceReader();
        this.oAuth2Storage = new OAuth2Storage(params.persis, persistenceRead);
        this.roomInteractionStorage = new RoomInteractionStorage(
            params.persis,
            persistenceRead,
            params.sender.id
        );
    }

    public async createNotionDatabase(): Promise<void> {
    }
}
