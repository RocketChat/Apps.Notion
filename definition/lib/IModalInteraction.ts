export interface IModalInteractionStorage {
    storeInteractionActionId(record: object): Promise<void>;
    getAllInteractionActionId(): Promise<{ data: Array<object> }>;
    clearInteractionActionId(record: object): Promise<void>;
    clearAllInteractionActionId(): Promise<void>;
    storePagesOrDatabase(records: object, workspaceId: string): Promise<void>;
    getPagesOrDatabase(workspaceId: string): Promise<object | undefined>;
    clearPagesOrDatabase(workspaceId: string): Promise<void>;
    storeInputElementState(associate: string, state: object): Promise<void>;
    getInputElementState(associate: string): Promise<object | undefined>;
    clearInputElementState(associate: string): Promise<void>;
}
