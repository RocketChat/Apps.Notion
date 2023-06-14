import {
    IUIKitResponse,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { clearAllInteraction } from "../helper/clearInteractions";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";

export class ExecuteViewSubmitHandler {
    private context: UIKitViewSubmitInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitViewSubmitInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { view, user } = this.context.getInteractionData();
        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id,
            view.id
        );

        const oAuth2Storage = new OAuth2Storage(
            this.persistence,
            persistenceRead
        );

        switch (view.id) {
            case DatabaseModal.VIEW_ID: {
                const { workspace_id } =
                    (await oAuth2Storage.getCurrentWorkspace(
                        user.id
                    )) as ITokenInfo;

                await modalInteraction.clearPagesOrDatabase(workspace_id);
                break;
            }
            default: {
            }
        }
        await clearAllInteraction(
            this.persistence,
            this.read,
            user.id,
            view.id
        );

        return this.context.getInteractionResponder().successResponse();
    }
}
