import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { INotionUser, ITokenInfo } from "../authorization/IOAuth2Storage";
import { ClientError, Error } from "../../errors/Error";
import { NotionObjectTypes, NotionOwnerType } from "../../enum/Notion";
import { RichText } from "@tryfabric/martian/build/src/notion";

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
    createNotionDatabase(
        token: string,
        data: object
    ): Promise<INotionDatabase | Error>;
    createCommentOnPage(
        tokenInfo: ITokenInfo,
        pageId: string,
        comment: string
    ): Promise<ICommentInfo | Error>;
}

export interface IParentPage {
    type: NotionObjectTypes.PAGE_ID;
    page_id: string;
}
export interface IPage {
    name: string;
    parent: IParentPage;
}

export interface INotionDatabase {
    name: string;
    link: string;
}

export interface ICommentInfo {
    comment: string;
    user: INotionUser | INotionUserBot;
    created_time: string;
}

export interface ICommentObject {
    object: NotionObjectTypes.COMMENT;
    id: string;
    parent: IParentPage;
    discussion_id: string;
    created_time: string;
    last_edited_time: string;
    created_by: Pick<INotionUser, "object" | "id">;
    rich_text: Array<RichText>;
}

export interface INotionUserBot {
    object: NotionOwnerType.USER;
    id: string;
    name: string | null;
    avatar_url: string | null;
    type: NotionOwnerType.BOT;
    bot: INotionBot | {};
}

interface INotionBot {
    owner: {
        type: NotionObjectTypes.WORKSPACE;
        workspace: boolean;
    };
    workspace_name: string;
}
