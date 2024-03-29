import {
    IUIKitResponse,
    UIKitViewCloseInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { clearAllInteraction } from "../helper/clearInteractions";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { CommentPage } from "../../enum/modals/CommentPage";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
import { SearchPageAndDatabase } from "../../enum/modals/common/SearchPageAndDatabaseComponent";
import { NotionObjectTypes } from "../../enum/Notion";
import { PropertyTypeValue } from "../../enum/modals/common/NotionProperties";
import { ActionButton } from "../../enum/modals/common/ActionButtons";

export class ExecuteViewClosedHandler {
    private context: UIKitViewCloseInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitViewCloseInteractionContext
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
                await modalInteraction.clearInputElementState(
                    DatabaseModal.PROPERTY_NAME
                );
                break;
            }
            case CommentPage.VIEW_ID: {
                await Promise.all([
                    modalInteraction.clearInputElementState(
                        CommentPage.COMMENT_INPUT_ACTION
                    ),
                    modalInteraction.clearInputElementState(
                        CommentPage.REFRESH_OPTION_VALUE
                    ),
                ]);
                break;
            }
            case NotionPageOrRecord.VIEW_ID: {
                const { workspace_id } =
                    (await oAuth2Storage.getCurrentWorkspace(
                        user.id
                    )) as ITokenInfo;

                await Promise.all([
                    modalInteraction.clearPagesOrDatabase(workspace_id),
                    modalInteraction.clearInputElementState(
                        SearchPageAndDatabase.ACTION_ID
                    ),
                    modalInteraction.clearAllInteractionActionId(),
                    modalInteraction.clearInputElementState(
                        PropertyTypeValue.PEOPLE
                    ),
                    modalInteraction.clearInputElementState(
                        ActionButton.SEND_TO_NEW_PAGE_MESSAGE_ACTION
                    ),
                ]);

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
