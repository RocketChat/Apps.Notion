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

        await this.preserveNewWorkspace(tokenInfo, userId);
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

        await this.removeDisconnectedWorkspace(removedTokenInfo, userId);
        return removedTokenInfo;
    }

    public async getAllConnectedWorkspaces(
        userId: string
    ): Promise<ITokenInfo[] | undefined> {
        const [tokenInfos] = (await this.persistenceRead.readByAssociations([
            new RocketChatAssociationRecord( // user association
                RocketChatAssociationModel.USER,
                userId
            ),
            new RocketChatAssociationRecord(
                RocketChatAssociationModel.MISC,
                NotionTokenType.ALL_CONNECTED_WORKSPACES
            ),
        ])) as Array<ITokenInfo[]>;

        return tokenInfos;
    }

    public async preserveNewWorkspace(
        tokenInfo: ITokenInfo,
        userId: string
    ): Promise<void> {
        let workspaces = await this.getAllConnectedWorkspaces(userId);

        if (workspaces) {
            const index = workspaces.findIndex((workspace) => {
                return workspace.workspace_id === tokenInfo.workspace_id;
            });

            if (index < 0) {
                workspaces.push(tokenInfo);
            } else {
                workspaces[index] = tokenInfo;
            }
        } else {
            workspaces = [tokenInfo];
        }

        await this.persistence.updateByAssociations(
            [
                new RocketChatAssociationRecord( // user association
                    RocketChatAssociationModel.USER,
                    userId
                ),
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    NotionTokenType.ALL_CONNECTED_WORKSPACES
                ),
            ],
            workspaces,
            true
        );
    }

    public async removeDisconnectedWorkspace(
        tokenInfo: ITokenInfo,
        userId: string
    ): Promise<void> {
        const workspaces = await this.getAllConnectedWorkspaces(userId);
        const user_association = new RocketChatAssociationRecord( // user association
            RocketChatAssociationModel.USER,
            userId
        );

        if (!workspaces) {
            return;
        }

        const filteredWorkspaces = workspaces.filter((workspace) => {
            return workspace.workspace_id !== tokenInfo.workspace_id;
        });

        await this.persistence.updateByAssociations(
            [
                user_association,
                new RocketChatAssociationRecord(
                    RocketChatAssociationModel.MISC,
                    NotionTokenType.ALL_CONNECTED_WORKSPACES
                ),
            ],
            filteredWorkspaces,
            true
        );

        if (filteredWorkspaces.length) {
            await this.persistence.updateByAssociations(
                [
                    user_association,
                    new RocketChatAssociationRecord(
                        RocketChatAssociationModel.MISC,
                        NotionTokenType.CURRENT_WORKSPACE
                    ),
                ],
                filteredWorkspaces[filteredWorkspaces.length - 1],
                true
            );
        }
    }
}
