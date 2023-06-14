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
        const { actionId, user, room } = this.context.getInteractionData();

        switch (actionId) {
            case OAuth2Action.CONNECT_TO_WORKSPACE: {
                this.handleConnectToWorkspace(user, room);
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
}
