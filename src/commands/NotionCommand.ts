import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ICommandUtilityParams } from "../../definition/command/ICommandUtility";
import { CommandUtility } from "./CommandUtility";

export class NotionCommand implements ISlashCommand {
    constructor(private readonly app: NotionApp) {}

    public command: string = "notion";
    public i18nParamsExample: string = "NotionCommandParams";
    public i18nDescription: string = "NotionCommandDescription";
    public providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const params = context.getArguments();
        const sender = context.getSender();
        const room = context.getRoom();
        const triggerId = context.getTriggerId();
        const threadId = context.getThreadId();

        const commandUtilityParams: ICommandUtilityParams = {
            params,
            sender,
            room,
            triggerId,
            threadId,
            read,
            modify,
            http,
            persis,
            app: this.app,
        };

        const commandUtility = new CommandUtility(commandUtilityParams);
        await commandUtility.resolveCommand();
    }
}
