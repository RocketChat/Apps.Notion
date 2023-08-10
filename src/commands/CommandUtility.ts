import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ICommandUtility,
    ICommandUtilityParams,
} from "../../definition/command/ICommandUtility";
import { CommandParam, SubCommandParam } from "../../enum/CommandParam";
import { Handler } from "../handlers/Handler";
import { sendHelperNotification } from "../helper/message";

export class CommandUtility implements ICommandUtility {
    public app: NotionApp;
    public params: Array<string>;
    public sender: IUser;
    public room: IRoom;
    public read: IRead;
    public modify: IModify;
    public http: IHttp;
    public persis: IPersistence;
    public triggerId?: string;
    public threadId?: string;

    constructor(props: ICommandUtilityParams) {
        this.app = props.app;
        this.params = props.params;
        this.sender = props.sender;
        this.room = props.room;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persis = props.persis;
        this.triggerId = props.triggerId;
        this.threadId = props.threadId;
    }

    public async resolveCommand(): Promise<void> {
        const handler = new Handler({
            app: this.app,
            sender: this.sender,
            room: this.room,
            read: this.read,
            modify: this.modify,
            http: this.http,
            persis: this.persis,
            triggerId: this.triggerId,
            threadId: this.threadId,
        });
        switch (this.params.length) {
            case 0: {
                await sendHelperNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room
                );
                break;
            }
            case 1: {
                await this.handleSingleParam(handler);
                break;
            }
            case 2: {
                await this.handleDualParam(handler);
                break;
            }
            default: {
                await sendHelperNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room
                );
            }
        }
    }

    private async handleSingleParam(handler: Handler): Promise<void> {
        const oAuth2ClientInstance = await this.app.getOAuth2Client();
        switch (this.params[0].toLowerCase()) {
            case CommandParam.CONNECT: {
                await oAuth2ClientInstance.connect(
                    this.room,
                    this.sender,
                    this.read,
                    this.modify,
                    this.http,
                    this.persis
                );
                break;
            }
            case CommandParam.DISCONNECT: {
                await oAuth2ClientInstance.disconnect(
                    this.room,
                    this.sender,
                    this.read,
                    this.modify,
                    this.http,
                    this.persis
                );
                break;
            }
            case CommandParam.COMMENT: {
                await handler.commentOnPages();
                break;
            }
            case CommandParam.CREATE: {
                await handler.createNotionPageOrRecord();
                break;
            }
            case CommandParam.WS:
            case CommandParam.WORKSPACE: {
                await handler.changeNotionWorkspace();
                break;
            }
            case CommandParam.SHARE: {
                await handler.shareNotionPage();
                break;
            }
            case CommandParam.VIEW : {
                await handler.viewNotionTable();
                break;
            }
            case CommandParam.HELP:
            default: {
                await sendHelperNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room
                );
                break;
            }
        }
    }

    private async handleDualParam(handler: Handler): Promise<void> {
        const [param, subparam] = this.params;
        switch (param.toLowerCase()) {
            case CommandParam.CREATE: {
                if (subparam.toLowerCase() === SubCommandParam.DATABASE) {
                    await handler.createNotionDatabase();
                    return;
                }
                await sendHelperNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room
                );
                break;
            }
            default: {
                await sendHelperNotification(
                    this.read,
                    this.modify,
                    this.sender,
                    this.room
                );
                break;
            }
        }
    }
}
