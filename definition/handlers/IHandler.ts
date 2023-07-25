import { OAuth2Storage } from "../../src/authorization/OAuth2Storage";
import { RoomInteractionStorage } from "../../src/storage/RoomInteraction";
import { ICommandUtilityParams } from "../command/ICommandUtility";

export interface IHandler extends Omit<ICommandUtilityParams, "params"> {
    oAuth2Storage: OAuth2Storage;
    roomInteractionStorage: RoomInteractionStorage;
    createNotionDatabase(): Promise<void>;
    commentOnPages(): Promise<void>;
    createNotionPageOrRecord(): Promise<void>;
    changeNotionWorkspace(): Promise<void>;
}

export type IHanderParams = Omit<ICommandUtilityParams, "params">;
