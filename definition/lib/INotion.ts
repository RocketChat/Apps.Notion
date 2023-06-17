import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { ITokenInfo } from "../authorization/IOAuth2Storage";
import { ClientError, Error } from "../../errors/Error";
import { NotionObjectTypes } from "../../enum/Notion";

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

    searchPages(token: string): Promise<Array<IPage> | Error>;
    createNotionDatabase(token: string, data: object); // return type we will create in next PR
}

export interface IParentPage {
    type: NotionObjectTypes.PAGE_ID;
    page_id: string;
}
export interface IPage {
    name: string;
    parent: IParentPage;
}
