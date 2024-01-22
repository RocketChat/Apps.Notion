import {
    ICommentInfo,
    ICommentObject,
    IDatabase,
    INotionDatabase,
    INotionPage,
    INotionSDK,
    INotionUserBot,
    IPage,
    IPageProperties,
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
import { Modals } from "../../enum/modals/common/Modals";
import {
    CheckboxEnum,
    NotSupportedPropertyTypes,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { IMessageAttachmentField } from "@rocket.chat/apps-engine/definition/messages";

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
    
            
    
            let results: Array<IPage> = response.data.results;
    
            if (response.data.has_more === true) {
                
                const recursiveResults = await this.recursiveSearchPages(token, response.data.next_cursor);
                results = results.concat(recursiveResults);
            }
            const result: Array<IPage> = [];
            for (const item of results) {
                const pageObject = await this.getPageObjectFromResults(item);
                if (pageObject) {
                    result.push(pageObject);
                }
            }
    
            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
    
    private async recursiveSearchPages(token: string, cursor: string): Promise<Array<IPage>> {
        const response = await this.http.post(NotionApi.SEARCH, {
            data: {
                start_cursor: cursor,
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": NotionApi.CONTENT_TYPE,
                "User-Agent": NotionApi.USER_AGENT,
                "Notion-Version": this.NotionVersion,
            },
        });
    
        if (response.statusCode.toString().startsWith("2")) {

    
            let results: Array<IPage> = response.data.results;
    
            if (response.data.has_more === true) {
                
                const recursiveResults = await this.recursiveSearchPages(token, response.data.next_cursor);
    
                results = results.concat(recursiveResults);
            }
    
            return results;
        } else {
            throw new AppsEngineException(`Error While Searching Pages: ${response.content}`);
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

    public async recursiveSearchPagesAndDatabases(token: string, startCursor?: string): Promise<Array<IPage | IDatabase>> {
        try {
            let response;
    
            if (startCursor) {
                response = await this.http.post(NotionApi.SEARCH, {
                    data: {
                        start_cursor: startCursor,
                    },
                    headers: this.getNotionApiHeaders(token),
                });
            } else {
                response = await this.http.post(NotionApi.SEARCH, {
                    headers: this.getNotionApiHeaders(token),
                });
            }
    
            if (!response.statusCode.toString().startsWith("2")) {
                throw new AppsEngineException(`Error While Searching Pages and Databases: ${response.content}`);
            }
    
            const { results, has_more, next_cursor } = response.data;
    
            const result: Array<IPage | IDatabase> = [];
    
            const databaseObjectArray: any = [];
    
            for (const item of results) {
                const objectType: string = item?.[NotionObjectTypes.OBJECT];
                if (objectType.includes(NotionObjectTypes.PAGE)) {
                    const pageObject = await this.getPageObjectFromResults(item);
                    if (pageObject) {
                        result.push(pageObject);
                    }
                } else {
                    databaseObjectArray.push(item);
                    const databaseObject = await this.getDatabaseObjectFromResults(item);
                    result.push(databaseObject);
                }
            }
            if (has_more) {
                const recursiveResults = await this.recursiveSearchPagesAndDatabases(token, next_cursor);
                result.push(...recursiveResults);
            }
  
            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
    
    public async searchPagesAndDatabases(token: string): Promise<Array<IPage | IDatabase> | Error> {
        try {
            const results = await this.recursiveSearchPagesAndDatabases(token);
            return results;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
    
    private getNotionApiHeaders(token: string): Record<string, string> {
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": NotionApi.CONTENT_TYPE,
            "User-Agent": NotionApi.USER_AGENT,
            "Notion-Version": this.NotionVersion,
        };
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

    public async createPage(
        token: string,
        page: IPage,
        prop: IPageProperties
    ): Promise<(INotionPage & { pageId: string }) | Error> {
        try {
            const { name, parent } = page;
            const { title } = prop;

            const data = {
                parent,
                properties: {
                    [NotionObjectTypes.TITLE]: {
                        [NotionObjectTypes.TITLE]: markdownToRichText(title),
                    },
                },
            };

            const response = await this.http.post(NotionApi.PAGES, {
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
                    `Error While Creating Page: `,
                    response.content
                );
            }

            let result: INotionPage = {
                link: response?.data?.url,
                name,
                title,
            };

            const pageId: string = response?.data?.id;

            return {
                ...result,
                pageId,
            };
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async retrieveDatabase(
        token: string,
        database_id: string
    ): Promise<object | Error> {
        try {
            const response = await this.http.get(
                NotionApi.CREATE_DATABASE + `/${database_id}`,
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
                    `Error While retrieving Database: `,
                    response.content
                );
            }

            const database = response.data;
            const properties = response.data?.[NotionObjectTypes.PROPERTIES];
            return properties;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async getRecordPropertyObject(item): Promise<object> {
        const properties: object = item?.[NotionObjectTypes.PROPERTIES];

        let result = {};

        for (const [property] of Object.entries(properties)) {
            const propertyObject: object = properties[property];
            const propertyType: string =
                propertyObject?.[NotionObjectTypes.TYPE];
            const propertyName: string =
                propertyObject?.[NotionObjectTypes.NAME];
            const propertyId: string = propertyObject?.[NotionObjectTypes.ID];

            if (propertyType.includes(NotionObjectTypes.TITLE.toString())) {
                result[NotionObjectTypes.TITLE] = {
                    id: propertyId,
                    name: propertyName,
                    type: NotionObjectTypes.TITLE,
                };
            } else {
                const commonProperties = {
                    id: propertyId,
                    name: propertyName,
                    type: propertyType,
                };

                switch (propertyType) {
                    case PropertyTypeValue.MULTI_SELECT:
                    case PropertyTypeValue.SELECT: {
                        const options: Array<{
                            id: string;
                            color: string;
                            name: string;
                        }> = propertyObject?.[propertyType]?.[Modals.OPTIONS];

                        result[Modals.ADDITIONAL_PROP][propertyName] = {
                            ...commonProperties,
                            config: {
                                [Modals.OPTIONS]: options,
                            },
                        };
                        break;
                    }
                    case PropertyTypeValue.FORMULA: {
                        const expression: string =
                            propertyObject?.[propertyType]?.[
                                NotionObjectTypes.EXPRESSION
                            ];
                        result[Modals.ADDITIONAL_PROP][propertyName] = {
                            ...commonProperties,
                            config: {
                                [NotionObjectTypes.EXPRESSION]: expression,
                            },
                        };
                        break;
                    }
                    case "status": {
                        const options: Array<{
                            id: string;
                            color: string;
                            name: string;
                        }> = propertyObject?.[propertyType]?.[Modals.OPTIONS];

                        const groups: Array<{
                            id: string;
                            name: string;
                            color: string;
                            options_ids: Array<string>;
                        }> = propertyObject?.[propertyType]?.[Modals.GROUPS];

                        result[Modals.ADDITIONAL_PROP][propertyName] = {
                            ...commonProperties,
                            config: {
                                [Modals.OPTIONS]: options,
                                [Modals.GROUPS]: groups,
                            },
                        };

                        break;
                    }
                    default: {
                        if (!NotSupportedPropertyTypes.includes(propertyType)) {
                            result[Modals.ADDITIONAL_PROP][propertyName] = {
                                ...commonProperties,
                            };
                        }
                        break;
                    }
                }
            }
        }
        return result;
    }

    public async createRecord(
        token: string,
        database: IDatabase,
        properties: object
    ): Promise<
        | {
              fields: Array<IMessageAttachmentField>;
              url: string;
              pageId: string;
          }
        | Error
    > {
        try {
            const { parent } = database;
            const data = {
                parent,
                properties,
            };

            const response = await this.http.post(NotionApi.PAGES, {
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
                    `Error While creating Record: `,
                    response.content
                );
            }
            const pageInfo = response.data;
            const url: string = pageInfo?.url;
            const pageId: string = pageInfo?.id;

            const prop = response.data?.[NotionObjectTypes.PROPERTIES];
            const fields = await this.getFieldsFromRecord(prop);
            return {
                fields,
                url,
                pageId,
            };
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async getFieldsFromRecord(properties: object) {
        const fields: Array<IMessageAttachmentField> = [];
        const propertyKeys = Object.keys(properties);

        for (let index = 0; index < propertyKeys.length; ++index) {
            const propertyObject: object = properties[propertyKeys[index]];
            const propertyType: string =
                propertyObject?.[NotionObjectTypes.TYPE];

            switch (propertyType) {
                case PropertyTypeValue.CHECKBOX: {
                    const value: boolean = propertyObject?.[propertyType];
                    fields.push({
                        short: true,
                        title: propertyKeys[index],
                        value: value ? CheckboxEnum.TRUE : CheckboxEnum.FALSE,
                    });
                    break;
                }
                case PropertyTypeValue.TEXT: {
                    const value = propertyObject?.[propertyType];
                    if (value?.length) {
                        const markdown = await this.richTextToMarkdown(value);
                        fields.push({
                            title: propertyKeys[index],
                            value: markdown,
                        });
                    }
                    break;
                }
                case PropertyTypeValue.NUMBER: {
                    const value: number | null = propertyObject?.[propertyType];
                    if (value) {
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: value.toString(),
                        });
                    }
                    break;
                }
                case PropertyTypeValue.URL: {
                    const value: string | null = propertyObject?.[propertyType];
                    if (value) {
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value,
                        });
                    }

                    break;
                }
                case PropertyTypeValue.EMAIL: {
                    const value: string | null = propertyObject?.[propertyType];
                    if (value) {
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value,
                        });
                    }
                    break;
                }
                case PropertyTypeValue.PHONE_NUMBER: {
                    const value: string | null = propertyObject?.[propertyType];
                    if (value) {
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value,
                        });
                    }
                    break;
                }
                case PropertyTypeValue.DATE: {
                    const value: object | null = propertyObject?.[propertyType];
                    if (value) {
                        const date = value?.["start"];
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: date,
                        });
                    }

                    break;
                }
                case PropertyTypeValue.SELECT: {
                    const value: object | null = propertyObject?.[propertyType];
                    if (value) {
                        const selectValue = value?.[NotionObjectTypes.NAME];
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: selectValue,
                        });
                    }

                    break;
                }
                case PropertyTypeValue.PEOPLE: {
                    const value: Array<object> | null =
                        propertyObject?.[propertyType];
                    let fieldValue = "";
                    if (value && value.length) {
                        const fullLength = value.length;
                        value.forEach((element, index) => {
                            const name: string =
                                element?.[NotionObjectTypes.NAME];
                            fieldValue += `${name}`;

                            if (index < fullLength - 1) {
                                fieldValue += ", ";
                            }
                        });

                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: fieldValue,
                        });
                    }
                    break;
                }
                case PropertyTypeValue.MULTI_SELECT: {
                    const value: Array<{
                        id: string;
                        name: string;
                        color: string;
                    }> | null = propertyObject?.[propertyType];
                    if (value && value.length) {
                        const fullLength = value.length;
                        let MultiSelectValue = "";
                        value.forEach((element, index) => {
                            const name: string =
                                element?.[NotionObjectTypes.NAME];
                            MultiSelectValue += `${name}`;

                            if (index < fullLength - 1) {
                                MultiSelectValue += ", ";
                            }
                        });

                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: MultiSelectValue,
                        });
                    }
                    break;
                }
                case "status": {
                    const value: object | null = propertyObject?.[propertyType];
                    if (value) {
                        const statusValue = value?.[NotionObjectTypes.NAME];
                        fields.push({
                            short: true,
                            title: propertyKeys[index],
                            value: statusValue,
                        });
                    }

                    break;
                }
            }
        }

        return fields;
    }

    public async retrievePage(
        token: string,
        pageId: string
    ): Promise<(IPage & { url: string }) | Error> {
        try {
            const response = await this.http.get(
                NotionApi.PAGES + `/${pageId}`,
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
                    `Error While retrieving Page: `,
                    response.content
                );
            }

            const pageInfo = response.data;
            const page = (await this.getPageObjectFromResults(
                pageInfo
            )) as IPage;
            const url: string = pageInfo?.url;

            return {
                ...page,
                url,
            };
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async appendMessageBlock(
        token: string,
        message: string,
        blockId: string
    ): Promise<boolean | Error> {
        try {
            const response = await this.http.patch(
                NotionApi.BLOCKS + `/${blockId}/children`,
                {
                    data: {
                        children: [
                            {
                                type: "callout",
                                callout: {
                                    rich_text: [
                                        {
                                            type: "text",
                                            text: {
                                                content: message,
                                                link: null,
                                            },
                                        },
                                    ],
                                    icon: {
                                        emoji: "⭐",
                                    },
                                    color: "default",
                                },
                            },
                        ],
                    },
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
                    `Error While Appending Message Block: `,
                    response.content
                );
            }

            return true;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    public async recursiveSearchDatabases(token: string, startCursor?: string): Promise<Array<IDatabase>> {
        try {
            let response;
    
            if (startCursor) {
                response = await this.http.post(NotionApi.SEARCH, {
                    data: {
                        filter: {
                            value: NotionObjectTypes.DATABASE,
                            property: NotionObjectTypes.PROPERTY,
                        },
                        start_cursor: startCursor,
                    },
                    headers: this.getNotionApiHeaders(token),
                });
            } else {
                response = await this.http.post(NotionApi.SEARCH, {
                    data: {
                        filter: {
                            value: NotionObjectTypes.DATABASE,
                            property: NotionObjectTypes.PROPERTY,
                        },
                    },
                    headers: this.getNotionApiHeaders(token),
                });
            }

            if (!response.statusCode.toString().startsWith("2")) {
                throw new AppsEngineException(`Error While Searching Databases: ${response.content}`);
            }
    
            const { results, has_more, next_cursor } = response.data;
    
            const result: Array<IDatabase> = [];
    
            results.forEach(async (item) => {
                const databaseObject = await this.getDatabaseObjectFromResults(item);
                result.push(databaseObject);
            });
    
            if (has_more) {
                const recursiveResults = await this.recursiveSearchDatabases(token, next_cursor);
                result.push(...recursiveResults);
            }
    
            return result;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
    
    public async searchDatabases(token: string): Promise<Array<IDatabase> | Error> {
        try {
            const results = await this.recursiveSearchDatabases(token);
            return results;
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
    

    public async queryDatabasePages(
        token: string,
        databaseId: string
    ): Promise<Array<Array<string>> | Error> {
        try {
            const response = await this.http.post(
                NotionApi.CREATE_DATABASE + `/${databaseId}/query`,
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
                    `Error While quering Database Pages List: `,
                    response.content
                );
            }
            const results = response.data?.results;
            return this.getDatabaseTable(results);
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }

    private async getDatabaseTable(
        results: Array<object>
    ): Promise<Array<Array<string>>> {
        const tableData: Array<Array<string>> = [];

        if (results?.length > 0) {
            for (let i = 0; i <= results.length; i++) {
                tableData.push([]);
            }

            const properties = results[0]?.[NotionObjectTypes.PROPERTIES];
            let propertyKeys = Object.keys(properties);

            const supportedProperties = Object.values(
                PropertyTypeValue
            ) as string[];
            supportedProperties.push(NotionObjectTypes.TITLE);
            supportedProperties.push("status");

            propertyKeys = propertyKeys.filter((propKey) => {
                return supportedProperties.includes(
                    properties[propKey]?.[NotionObjectTypes.TYPE]
                );
            });

            tableData[0].push(...propertyKeys);

            results?.forEach(async (item, index) => {
                const propertyItem: object =
                    item?.[NotionObjectTypes.PROPERTIES];

                propertyKeys.forEach(async (key) => {
                    const propertyValueObject = propertyItem?.[key];
                    const type: string =
                        propertyValueObject?.[NotionObjectTypes.TYPE];
                    switch (type) {
                        case NotionObjectTypes.TITLE: {
                            const richText = propertyValueObject?.[type];
                            const markdown =
                                richText[0]?.[NotionObjectTypes.TEXT]?.[
                                    "content"
                                ] ?? "";
                            tableData[index + 1].push(markdown);
                            break;
                        }
                        case PropertyTypeValue.CHECKBOX: {
                            const checkbox: boolean =
                                propertyValueObject?.[type];
                            if (checkbox) {
                                tableData[index + 1].push("✅");
                            } else {
                                tableData[index + 1].push("❎");
                            }
                            break;
                        }
                        case PropertyTypeValue.TEXT: {
                            const richText = propertyValueObject?.[type];
                            const markdown =
                                richText[0]?.[NotionObjectTypes.TEXT]?.[
                                    "content"
                                ] ?? "";
                            tableData[index + 1].push(markdown);
                            break;
                        }
                        case PropertyTypeValue.NUMBER: {
                            const value: number | undefined =
                                propertyValueObject?.[type];
                            if (value) {
                                tableData[index + 1].push(value.toString());
                            } else {
                                tableData[index + 1].push("");
                            }

                            break;
                        }
                        case PropertyTypeValue.URL: {
                            const url: string | null =
                                propertyValueObject?.[type];

                            if (url) {
                                tableData[index + 1].push(url);
                            } else {
                                tableData[index + 1].push("");
                            }

                            break;
                        }
                        case PropertyTypeValue.EMAIL: {
                            const email: string | null =
                                propertyValueObject?.[type];

                            if (email) {
                                tableData[index + 1].push(email);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.PHONE_NUMBER: {
                            const phoneNumber: string | null =
                                propertyValueObject?.[type];
                            if (phoneNumber) {
                                tableData[index + 1].push(phoneNumber);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.DATE: {
                            const date: object | null =
                                propertyValueObject?.[type];
                            if (date) {
                                const value = date?.["start"];
                                tableData[index + 1].push(value);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.SELECT: {
                            const select: object | null =
                                propertyValueObject?.[type];

                            if (select) {
                                const selectValue =
                                    select?.[NotionObjectTypes.NAME];
                                tableData[index + 1].push(selectValue);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.PEOPLE: {
                            const people: Array<object> | null =
                                propertyValueObject?.[type];

                            let fieldValue = "";
                            if (people && people.length) {
                                const fullLength = people.length;
                                people.forEach((element, eleindex) => {
                                    const name: string =
                                        element?.[NotionObjectTypes.NAME];
                                    fieldValue += `${name}`;

                                    if (eleindex < fullLength - 1) {
                                        fieldValue += ", ";
                                    }
                                });
                            }

                            tableData[index + 1].push(fieldValue);
                            break;
                        }
                        case PropertyTypeValue.MULTI_SELECT: {
                            const multiSelect: Array<{
                                id: string;
                                name: string;
                                color: string;
                            }> | null = propertyValueObject?.[type];

                            let MultiSelectValue = "";

                            if (multiSelect && multiSelect.length) {
                                const fullLength = multiSelect.length;
                                multiSelect.forEach((element, index) => {
                                    const name: string =
                                        element?.[NotionObjectTypes.NAME];
                                    MultiSelectValue += `${name}`;

                                    if (index < fullLength - 1) {
                                        MultiSelectValue += ", ";
                                    }
                                });
                            }
                            tableData[index + 1].push(MultiSelectValue);
                            break;
                        }
                        case "status": {
                            const status: object | null =
                                propertyValueObject?.[type];
                            if (status) {
                                const statusValue =
                                    status?.[NotionObjectTypes.NAME];
                                tableData[index + 1].push(statusValue);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.CREATED_BY: {
                            const createdBy = propertyValueObject?.[type];
                            const name: string =
                                createdBy?.[NotionObjectTypes.NAME];
                            tableData[index + 1].push(createdBy);
                            break;
                        }
                        case PropertyTypeValue.CREATED_TIME: {
                            const createdTime = propertyValueObject?.[type];
                            tableData[index + 1].push(createdTime);
                            break;
                        }
                        case PropertyTypeValue.LAST_EDITED_TIME: {
                            const lastEditedTime = propertyValueObject?.[type];
                            tableData[index + 1].push(lastEditedTime);
                            break;
                        }
                        case PropertyTypeValue.LAST_EDITED_BY: {
                            const lastEditedBy = propertyValueObject?.[type];
                            const name: string =
                                lastEditedBy?.[NotionObjectTypes.NAME];
                            tableData[index + 1].push(lastEditedBy);
                            break;
                        }
                        case PropertyTypeValue.FORMULA: {
                            const formula = propertyValueObject?.[type];
                            const value: string | null = formula?.["string"];
                            if (value) {
                                tableData[index + 1].push(value);
                            } else {
                                tableData[index + 1].push("");
                            }
                            break;
                        }
                        case PropertyTypeValue.FILES: {
                            const files: Array<object> | null =
                                propertyValueObject?.[type];
                            let filesLink = "";

                            if (files && files.length) {
                                files.forEach((file, index) => {
                                    const name: string =
                                        file?.[NotionObjectTypes.NAME];
                                    const url: string =
                                        file?.["file"]?.[PropertyTypeValue.URL];

                                    filesLink += `${name}`;

                                    if (index < files.length - 1) {
                                        filesLink += ", ";
                                    }
                                });
                            }
                            tableData[index + 1].push(filesLink);
                            break;
                        }
                    }
                });
            });
        }
        return tableData;
    }
}
