import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { OAuth2Action } from "../../enum/OAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { uuid } from "../helper/uuid";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { createDatabaseModal } from "../modals/createDatabaseModal";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { Error } from "../../errors/Error";
import { sendNotificationWithConnectBlock } from "../helper/message";

export class ExecuteBlockActionHandler {
    private context: UIKitBlockInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitBlockInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { actionId, user, room, container } =
            this.context.getInteractionData();
        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id,
            container.id
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

        switch (actionId) {
            case OAuth2Action.CONNECT_TO_WORKSPACE: {
                this.handleConnectToWorkspace(user, room);
                break;
            }
            case DatabaseModal.ADD_PROPERTY_ACTION: {
                this.handleAddPropertyAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case DatabaseModal.REMOVE_PROPERTY_ACTION: {
                this.handleRemovePropertyAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            default: {
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleConnectToWorkspace(
        user: IUser,
        room?: IRoom
    ): Promise<void> {
        const persistenceRead = this.read.getPersistenceReader();
        const roomId = room?.id as string;
        const roomInteraction = new RoomInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id
        );
        await roomInteraction.storeInteractionRoomId(roomId);
    }

    private async handleAddPropertyAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user } = this.context.getInteractionData();
        const PropertyName = `${DatabaseModal.PROPERTY_NAME_ACTION}-${uuid()}`;
        const PropertyType = `${
            DatabaseModal.PROPERTY_TYPE_SELECT_ACTION
        }-${uuid()}`;

        await modalInteraction.storeInteractionActionId({
            PropertyType,
            PropertyName,
        });

        this.handleUpdateofDatabaseModal(
            modalInteraction,
            oAuth2Storage,
            roomInteractionStorage
        );
    }

    private async handleRemovePropertyAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user, value } = this.context.getInteractionData();

        const record: object = JSON.parse(value as string);
        await modalInteraction.clearInteractionActionId(record);

        this.handleUpdateofDatabaseModal(
            modalInteraction,
            oAuth2Storage,
            roomInteractionStorage
        );
    }

    private async handleUpdateofDatabaseModal(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user } = this.context.getInteractionData();
        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return;
        }

        const modal = await createDatabaseModal(
            this.app,
            user,
            this.read,
            this.persistence,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Propably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.context.getInteractionData().triggerId;

        await this.modify.getUiController().updateSurfaceView(
            modal,
            {
                triggerId,
            },
            user
        );
    }
}
