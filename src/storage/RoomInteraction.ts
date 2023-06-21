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
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}
    public async storeInteractionRoomId(
        userId: string,
        roomId: string
    ): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${userId}#RoomId`
        );
        await this.persistence.updateByAssociation(
            association,
            { roomId: roomId },
            true
        );
    }

    public async getInteractionRoomId(userId: string): Promise<string> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${userId}#RoomId`
        );
        const [result] = (await this.persistenceRead.readByAssociation(
            association
        )) as Array<{ roomId: string }>;
        return result.roomId;
    }

    public async clearInteractionRoomId(userId: string): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${userId}#RoomId`
        );
        await this.persistence.removeByAssociation(association);
    }
}
