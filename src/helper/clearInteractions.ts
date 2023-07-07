import {
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { RoomInteractionStorage } from "../storage/RoomInteraction";

export async function clearAllInteraction(
    persistence: IPersistence,
    read: IRead,
    userId: string,
    viewId: string
) {
    const persistenceRead = read.getPersistenceReader();

    const roomInteraction = new RoomInteractionStorage(
        persistence,
        persistenceRead,
        userId
    );

    const modalInteraction = new ModalInteractionStorage(
        persistence,
        persistenceRead,
        userId,
        viewId
    );

    await roomInteraction.clearInteractionRoomId();
    await modalInteraction.clearAllInteractionActionId();
}
