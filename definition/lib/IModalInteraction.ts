export interface IModalInteractionStorage {
    storeInteractionActionId(record: object): Promise<void>;
    getAllInteractionActionId(): Promise<{ data: Array<object> }>;
    clearInteractionActionId(record: object): Promise<void>;
    clearAllInteractionActionId(): Promise<void>;
}
