export interface IRoomInteractionStorage {
    storeInteractionRoomId(roomId: string): Promise<void>;
    getInteractionRoomId(): Promise<string>;
    clearInteractionRoomId(): Promise<void>;
}
