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
import { CommandParam } from "../../enum/CommandParam";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";

export class CommandUtility implements ICommandUtility {
    public app: NotionApp;
    public context: SlashCommandContext;
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
        this.context = props.context;
        this.read = props.read;
        this.modify = props.modify;
        this.http = props.http;
        this.persis = props.persis;
        this.params = props.context.getArguments();
        this.sender = props.context.getSender();
        this.room = props.context.getRoom();
        this.triggerId = props.context.getTriggerId();
        this.threadId = props.context.getThreadId();
    }

    public async resolveCommand(): Promise<void> {
        switch (this.params.length) {
            case 0: {
                break;
            }
            case 1: {
                await this.handleSingleParam();
                break;
            }
            default: {
            }
        }
    }

    private async handleSingleParam(): Promise<void> {
        const oAuth2ClientInstance = await this.app.getOAuth2Client();
        switch (this.params[0]) {
            case CommandParam.CONNECT: {
                await oAuth2ClientInstance.connect(
                    this.context,
                    this.read,
                    this.modify,
                    this.http,
                    this.persis
                );
                break;
            }
            case CommandParam.DISCONNECT: {
                await oAuth2ClientInstance.disconnect(
                    this.context,
                    this.read,
                    this.modify,
                    this.http,
                    this.persis
                );
                break;
            }
            default: {
            }
        }
    }
}
