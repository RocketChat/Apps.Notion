import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IRoomInteractionStorage } from "../../definition/lib/IRoomInteraction";
import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";

export class RoomInteractionStorage implements IRoomInteractionStorage {
    private userId: string;
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
        userId: string
    ) {
        this.userId = userId;
    }

    public async storeInteractionRoomId(roomId: string): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#RoomId`
        );
        await this.persistence.updateByAssociation(
            association,
            { roomId: roomId },
            true
        );
    }

    public async getInteractionRoomId(): Promise<string> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#RoomId`
        );
        const [result] = (await this.persistenceRead.readByAssociation(
            association
        )) as Array<{ roomId: string }>;
        return result.roomId;
    }

    public async clearInteractionRoomId(): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#RoomId`
        );
        await this.persistence.removeByAssociation(association);
    }
}
