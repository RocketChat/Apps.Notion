import {
    ICommentInfo,
    ICommentObject,
    IDatabase,
    INotionDatabase,
    INotionSDK,
    INotionUserBot,
    IPage,
} from "../../definition/lib/INotion";
import {
    HttpStatusCode,
    IHttp,
} from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import {
    INotionUser,
    ITokenInfo,
} from "../../definition/authorization/IOAuth2Storage";
import {
    ClientError,
    Error,
    ForbiddenError,
    ManyRequestsError,
    NotFoundError,
    ServerError,
} from "../../errors/Error";
import {
    NotionApi,
    NotionObjectTypes,
    NotionOwnerType,
} from "../../enum/Notion";
import { OAuth2Credential, OAuth2Locator } from "../../enum/OAuth2";
import { AppsEngineException } from "@rocket.chat/apps-engine/definition/exceptions";
import { RichText } from "@tryfabric/martian/build/src/notion";
import { markdownToRichText } from "@tryfabric/martian";
import {
    getMentionObject,
    getWhiteSpaceTextObject,
} from "../helper/getNotionObject";

export class NotionSDK implements INotionSDK {
    baseUrl: string;
    NotionVersion: string;
    http: IHttp;
    constructor(http: IHttp) {
        this.baseUrl = NotionApi.BASE_URL;
        this.NotionVersion = NotionApi.VERSION;
        this.http = http;
    }

    public async createToken(
        redirectUrl: URL,
        code: string,
        credentials: string
    ): Promise<ITokenInfo | ClientError> {
        try {
            const response = await this.http.post(
                OAuth2Locator.accessTokenUrl,
                {
                    data: {
                        grant_type: OAuth2Credential.GRANT_TYPE,
                        redirect_uri: redirectUrl.toString(),
                        code,
                    },
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        "Content-Type": NotionApi.CONTENT_TYPE,
                        "User-Agent": NotionApi.USER_AGENT,
                    },
                }
            );

            if (!response.statusCode.toString().startsWith("2")) {
                return new ClientError(
                    `Error while Creating token: ${response.statusCode}`,
                    response.content
                );
            }
            return response.data as ITokenInfo;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async searchPages(token: string): Promise<Array<IPage> | Error> {
        try {
            const response = await this.http.post(NotionApi.SEARCH, {
                data: {
                    filter: {
                        value: NotionObjectTypes.PAGE,
                        property: NotionObjectTypes.PROPERTY,
                    },
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While Searching Pages: `,
                    response.content
                );
            }

            const { results } = response.data;

            const result: Array<IPage> = [];
            results.forEach(async (item) => {
                const pageObject = await this.getPageObjectFromResults(item);
                if (pageObject) {
                    result.push(pageObject);
                }
            });

            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async getPageObjectFromResults(item): Promise<IPage | null> {
        const typesWithTitleProperty = [
            NotionObjectTypes.WORKSPACE.toString(),
            NotionObjectTypes.PAGE_ID.toString(),
        ];
        const parentType: string = item.parent.type;
        const properties = item.properties;
        const pageId: string = item.id;

        if (typesWithTitleProperty.includes(parentType)) {
            const pageName: string =
                properties.title.title[0]?.text?.content ||
                NotionObjectTypes.UNTITLED;
            return this.returnPage(pageName, pageId);
        }

        // title property either be at first or last position
        const columns = Object.keys(properties);
        const firstColumn = columns[0];
        const lastColumn = columns[columns.length - 1];

        // title at first position and has subpage
        if (
            properties[firstColumn].title &&
            properties[firstColumn].title.length
        ) {
            const name: string =
                properties[firstColumn].title[0]?.text?.content ||
                NotionObjectTypes.UNTITLED;
            return this.returnPage(name, pageId);
        }

        //title at last position and has subpage
        if (
            properties[lastColumn].title &&
            properties[lastColumn].title.length
        ) {
            const name: string =
                properties[lastColumn].title[0]?.text?.content ||
                NotionObjectTypes.UNTITLED;
            return this.returnPage(name, pageId);
        }

        return null;
    }

    private returnPage(name: string, page_id: string): IPage {
        return {
            name: `📄 ${name}`,
            parent: {
                type: NotionObjectTypes.PAGE_ID,
                page_id,
            },
        };
    }

    private async handleErrorResponse(
        statusCode: number,
        message: string,
        additionalInfo?: string
    ): Promise<Error> {
        switch (statusCode) {
            case HttpStatusCode.BAD_REQUEST: {
                return new ClientError(message, additionalInfo);
            }
            case HttpStatusCode.TOO_MANY_REQUESTS: {
                return new ManyRequestsError(message, additionalInfo);
            }
            case HttpStatusCode.FORBIDDEN: {
                return new ForbiddenError(message, additionalInfo);
            }
            case HttpStatusCode.NOT_FOUND: {
                return new NotFoundError(message, additionalInfo);
            }
            default: {
                return new ServerError(message, additionalInfo);
            }
        }
    }

    public async createNotionDatabase(
        token: string,
        data: object
    ): Promise<INotionDatabase | Error> {
        try {
            const response = await this.http.post(NotionApi.CREATE_DATABASE, {
                data,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While Creating Database: `,
                    response.content
                );
            }

            const result: INotionDatabase = {
                name:
                    response.data.title[0]?.text?.content ||
                    NotionObjectTypes.UNTITLED,
                link: response.data.url,
            };

            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async retrieveCommentsOnpage(
        pageId: string,
        token: string
    ): Promise<Array<ICommentInfo> | Error> {
        try {
            const response = await this.http.get(NotionApi.COMMENTS, {
                params: {
                    block_id: pageId,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While retrieving Comments: `,
                    response.content
                );
            }

            const users = await this.retrieveAllUsers(token);
            if (users instanceof Error) {
                return users;
            }

            // id -> user
            const usersMap = new Map<string, INotionUser | INotionUserBot>();

            users.forEach((user) => {
                usersMap.set(user.id, user);
            });

            // Note: Every User has a bot user with different Id but same name

            const results: Array<ICommentObject> = response.data?.results;
            results.reverse();
            let comments: Array<ICommentInfo> = [];

            for (const result of results) {
                const { created_by, created_time, rich_text } = result;
                const { id } = created_by;
                const comment = await this.richTextToMarkdown(rich_text);

                let user: INotionUser | INotionUserBot | undefined =
                    usersMap.get(id);
                if (
                    user?.type === NotionOwnerType.BOT &&
                    rich_text.length &&
                    rich_text[0].type === NotionObjectTypes.MENTION
                ) {
                    const mentionUser: INotionUser =
                        rich_text[0]?.[NotionObjectTypes.MENTION]?.[
                            NotionOwnerType.USER
                        ];

                    user = usersMap.get(mentionUser.id);
                }

                if (!user) {
                    const publicUser = await this.retrieveUser(id, token);
                    if (publicUser instanceof Error) {
                        return publicUser;
                    }

                    user = publicUser;
                }

                comments.push({
                    comment,
                    user,
                    created_time,
                });
            }
            return comments;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async richTextToMarkdown(richText: Array<RichText>) {
        return richText.reduce((previous, current) => {
            return `${previous}${this.convertToMarkdown(current)}`;
        }, "");
    }

    private convertToMarkdown(richText: RichText) {
        switch (richText.type) {
            case NotionObjectTypes.TEXT: {
                const { text, annotations } = richText;
                let { content, link } = text;

                if (annotations) {
                    const { bold, italic, strikethrough, code } = annotations;

                    if (bold) {
                        content = `**${content}**`;
                    }

                    if (italic) {
                        content = `_${content}_`;
                    }

                    if (code) {
                        content = `\`${content}\``;
                    }

                    if (strikethrough) {
                        content = `~${content}~`;
                    }
                }

                if (link) {
                    content = `[${content}](${link.url})`;
                }

                return content;
                break;
            }
            // handle mentions and expression later
        }

        return "";
    }

    public async retrieveUser(
        userId: string,
        token: string
    ): Promise<INotionUser | INotionUserBot | Error> {
        try {
            const response = await this.http.get(
                NotionApi.USERS + `/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": NotionApi.CONTENT_TYPE,
                        "User-Agent": NotionApi.USER_AGENT,
                        "Notion-Version": this.NotionVersion,
                    },
                }
            );

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While retrieving User: `,
                    response.content
                );
            }

            const user: INotionUser = response.data;
            return user;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async retrieveAllUsers(
        token: string
    ): Promise<Array<INotionUser | INotionUserBot> | Error> {
        try {
            const response = await this.http.get(NotionApi.USERS, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While retrieving All Users: `,
                    response.content
                );
            }
            const users: Array<INotionUser | INotionUserBot> =
                response.data?.results;
            return users;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async createCommentOnPage(
        tokenInfo: ITokenInfo,
        pageId: string,
        comment: string
    ): Promise<ICommentInfo | Error> {
        try {
            const { access_token, owner } = tokenInfo;
            const { user } = owner;
            const { name } = user;

            const rich_text_mention = getMentionObject(user, name);
            const white_space_comment = getWhiteSpaceTextObject();

            const rich_text_comment = markdownToRichText(comment);
            const rich_text = [
                rich_text_mention,
                white_space_comment,
                ...rich_text_comment,
            ];

            const response = await this.http.post(NotionApi.COMMENTS, {
                data: {
                    [NotionObjectTypes.PARENT]: {
                        [NotionObjectTypes.TYPE]: NotionObjectTypes.PAGE_ID,
                        [NotionObjectTypes.PAGE_ID]: pageId,
                    },
                    rich_text,
                },
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While Creating Comment On Page: `,
                    response.content
                );
            }
            const addedComment = response.data;
            const created_time = addedComment?.created_time;
            return {
                comment,
                user,
                created_time,
            };
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async searchPagesAndDatabases(
        token: string
    ): Promise<Array<IPage | IDatabase> | Error> {
        try {
            const response = await this.http.post(NotionApi.SEARCH, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": NotionApi.CONTENT_TYPE,
                    "User-Agent": NotionApi.USER_AGENT,
                    "Notion-Version": this.NotionVersion,
                },
            });

            if (!response.statusCode.toString().startsWith("2")) {
                return this.handleErrorResponse(
                    response.statusCode,
                    `Error While Searching Pages: `,
                    response.content
                );
            }

            const { results } = response.data;

            const result: Array<IPage | IDatabase> = [];
            results.forEach(async (item) => {
                const objectType: string = item?.[NotionObjectTypes.OBJECT];
                if (objectType.includes(NotionObjectTypes.PAGE)) {
                    const pageObject = await this.getPageObjectFromResults(
                        item
                    );

                    if (pageObject) {
                        result.push(pageObject);
                    }
                } else {
                    const databaseObject =
                        await this.getDatabaseObjectFromResults(item);

                    result.push(databaseObject);
                }
            });

            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async getDatabaseObjectFromResults(item): Promise<IDatabase> {
        const databaseNameTitleObject = item?.[NotionObjectTypes.TITLE];
        const name: string = databaseNameTitleObject.length
            ? databaseNameTitleObject[0]?.plain_text
            : "Untitled";
        const database_id: string = item.id;

        return {
            info: {
                name: `📚 ${name}`,
                link: item?.url,
            },
            parent: {
                type: NotionObjectTypes.DATABASE_ID,
                database_id,
            },
        };
    }

}
