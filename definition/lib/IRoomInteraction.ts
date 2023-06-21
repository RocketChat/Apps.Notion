export interface IRoomInteractionStorage {
    storeInteractionRoomId(userId: string, roomId: string): Promise<void>;
    getInteractionRoomId(userId: string): Promise<string>;
    clearInteractionRoomId(userId: string): Promise<void>;
}
