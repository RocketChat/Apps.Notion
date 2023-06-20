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
import { clearAllInteraction } from "../helper/clearInteractions";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import {
    sendNotification,
    sendNotificationWithConnectBlock,
} from "../helper/message";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { getNotionDatabaseObject } from "../helper/getNotionDatabaseObject";
import { Error } from "../../errors/Error";
import { Modals } from "../../enum/modals/common/Modals";
import { handleMissingProperties } from "../helper/handleMissingProperties";

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

        const roomInteractionStorage = new RoomInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id
        );
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        switch (view.id) {
            case DatabaseModal.VIEW_ID: {
                return this.handleCreationOfDatabase(
                    room,
                    oAuth2Storage,
                    modalInteraction
                );
                break;
            }
            default: {
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    public async handleCreationOfDatabase(
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { NotionSdk } = this.app.getUtils();
        const { user, view } = this.context.getInteractionData();
        const { state } = view;

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return this.context.getInteractionResponder().errorResponse();
        }

        const { access_token, workspace_id, workspace_name } = tokenInfo;

        const records: { data: Array<object> } | undefined =
            await modalInteraction.getAllInteractionActionId();

        const missingObject = handleMissingProperties(state, records?.data);
        const missingProperties = missingObject?.[Modals.MISSING];
        if (Object.keys(missingProperties).length) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: view.id,
                errors: missingProperties,
            });
        }

        const data = getNotionDatabaseObject(state, records?.data);

        const response = await NotionSdk.createNotionDatabase(
            access_token,
            data
        );

        // code need to change to configure the notification nicely

        let message: string;

        if (response instanceof Error) {
            message = `Error while Creating Database in **${workspace_name}**`;
        } else {
            const name: string = response.name;
            const link: string = response.link;
            message = `Your Database [**${name}**](${link}) is created successfully in **${workspace_name}**`;
        }

        await sendNotification(this.read, this.modify, user, room, {
            message: message,
        });

        await clearAllInteraction(
            this.persistence,
            this.read,
            user.id,
            view.id
        );
        await modalInteraction.clearPagesOrDatabase(workspace_id);

        return this.context.getInteractionResponder().successResponse();
    }
}
