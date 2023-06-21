import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { ITokenInfo } from "../authorization/IOAuth2Storage";
import { ClientError } from "../../errors/Error";
import { NotionApi } from "../../enum/Notion";

export interface INotion {
    baseUrl: string;
    NotionVersion: string;
}

export interface INotionSDK extends INotion {
    http: IHttp;
    createToken(
        redirectUrl: URL,
        code: string,
        credentials: string
    ): Promise<ITokenInfo | ClientError>;
}
