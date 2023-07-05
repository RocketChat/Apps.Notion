import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IUIKitResponse,
    UIKitActionButtonInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import { ActionButton } from "../../enum/modals/common/ActionButtons";
import { Handler } from "./Handler";

export class ExecuteActionButtonHandler {
    private context: UIKitActionButtonInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitActionButtonInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { actionId, user, room, triggerId } =
            this.context.getInteractionData();

        const handler = new Handler({
            app: this.app,
            sender: user,
            room: room,
            read: this.read,
            modify: this.modify,
            http: this.http,
            persis: this.persistence,
            triggerId,
        });

        switch (actionId) {
            case ActionButton.COMMENT_ON_PAGES_MESSAGE_BOX_ACTION: {
                await handler.commentOnPages();
                break;
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }
}
