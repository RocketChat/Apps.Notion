import { NotionOwnerType, NotionTokenType } from "../../enum/Notion";

export interface IOAuth2Storage {
    connectUserToWorkspace(
        tokenInfo: ITokenInfo,
        userId: string
    ): Promise<void>;
    getCurrentWorkspace(userId: string): Promise<ITokenInfo | null>;
    disconnectUserFromCurrentWorkspace(userId: string): Promise<ITokenInfo | null>;
}

export interface ITokenInfo {
    access_token: string;
    token_type: NotionTokenType.TOKEN_TYPE;
    bot_id: string;
    workspace_icon: string | null;
    workspace_id: string;
    workspace_name: string | null;
    owner: INotionOwner;
    duplicated_template_id: string | null;
}

interface INotionOwner {
    type: NotionOwnerType.USER;
    user: INotionUser;
}

export interface INotionUser {
    object: NotionOwnerType.USER;
    id: string;
    name: string | null;
    avatar_url: string | null;
    type: NotionOwnerType.PERSON;
    person: INotionPerson;
}

interface INotionPerson {
    email: string;
}
