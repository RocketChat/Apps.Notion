import { IModalInteractionStorage } from "../../definition/lib/IModalInteraction";
import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
export class ModalInteractionStorage implements IModalInteractionStorage {
    private userId: string;
    private viewId: string;
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead,
        userId: string,
        viewId: string
    ) {
        this.userId = userId;
        this.viewId = viewId;
    }

    public async storeInteractionActionId(record: object): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#${this.viewId}`
        );
        let objectToStore: object;
        const records = await this.getAllInteractionActionId();
        if (records && records.data.length) {
            records.data.push(record);
            objectToStore = records;
        } else {
            objectToStore = { data: [record] };
        }

        await this.persistence.updateByAssociations(
            [association],
            objectToStore,
            true
        );
    }

    public async getAllInteractionActionId(): Promise<{ data: Array<object> }> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#${this.viewId}`
        );
        const [result] = (await this.persistenceRead.readByAssociation(
            association
        )) as Array<{ data: Array<object> }>;
        return result;
    }

    public async clearInteractionActionId(record: object): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#${this.viewId}`
        );
        const records = await this.getAllInteractionActionId();

        if (records) {
            const filteredRecords = records.data.filter((item) => {
                return JSON.stringify(item) !== JSON.stringify(record);
            });

            const objectToStore = { data: filteredRecords };

            await this.persistence.updateByAssociations(
                [association],
                objectToStore,
                true
            );
        }
    }

    public async clearAllInteractionActionId(): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.USER,
            `${this.userId}#${this.viewId}`
        );
        await this.persistence.removeByAssociation(association);
    }
}
