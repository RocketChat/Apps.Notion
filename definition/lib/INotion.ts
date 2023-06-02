import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { URL } from "url";
import { ITokenInfo } from "../authorization/IOAuth2Storage";
import { ClientError } from "../../errors/Error";
import { NotionApi } from "../../enum/Notion";

export interface INotion {
    baseUrl: string;
    NotionVersion: string;
}

export interface INotionSDK extends INotion {
    getAuthorizationUrl(user: IUser, read: IRead): Promise<string>;
    createToken(
        http: IHttp,
        redirectUrl: URL,
        code: string,
        credentials: string
    ): Promise<ITokenInfo | ClientError>;
}
