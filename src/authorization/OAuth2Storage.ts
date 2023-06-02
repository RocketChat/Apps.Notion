import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    IOAuth2Storage,
    ITokenInfo,
} from "../../definition/authorization/IOAuth2Storage";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { NotionTokenType } from "../../enum/Notion";

export class OAuth2Storage implements IOAuth2Storage {
    constructor(
        private readonly persistence: IPersistence,
        private readonly persistenceRead: IPersistenceRead
    ) {}
    public async connectUserToWorkspace(
        tokenInfo: ITokenInfo,
        userId: string
    ): Promise<void> {
        await this.persistence.updateByAssociations(
            [
                new RocketChatAssociationRecord( // user association
                    RocketChatAssociationModel.USER,
                    userId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    NotionTokenType.CURRENT_WORKSPACE
                ),
            ],
            tokenInfo,
            true
        );

        return;
    }

    public async getCurrentWorkspace(
        userId: string
    ): Promise<ITokenInfo | null> {
        const [tokenInfo] = (await this.persistenceRead.readByAssociations([
            new RocketChatAssociationRecord( // user association
                RocketChatAssociationModel.USER,
                userId
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                NotionTokenType.CURRENT_WORKSPACE
            ),
        ])) as ITokenInfo[];

        return tokenInfo;
    }

    public async disconnectUserFromCurrentWorkspace(
        userId: string
    ): Promise<ITokenInfo | null> {
        const [removedTokenInfo] = (await this.persistence.removeByAssociations(
            [
                new RocketChatAssociationRecord( // user association
                    RocketChatAssociationModel.USER,
                    userId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    NotionTokenType.CURRENT_WORKSPACE
                ),
            ]
        )) as ITokenInfo[];
        return removedTokenInfo;
    }
}
