import { INotionSDK, IPage } from "../../definition/lib/INotion";
import {
    HttpStatusCode,
    IHttp,
} from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import {
    ClientError,
    Error,
    ForbiddenError,
    ManyRequestsError,
    NotFoundError,
    ServerError,
} from "../../errors/Error";
import { NotionApi, NotionObjectTypes } from "../../enum/Notion";
import { OAuth2Credential, OAuth2Locator } from "../../enum/OAuth2";
import { AppsEngineException } from "@rocket.chat/apps-engine/definition/exceptions";

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
            const pageName: string = properties.title.title[0].text.content;
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
            const name: string = properties[firstColumn].title[0].text.content;
            return this.returnPage(name, pageId);
        }

        //title at last position and has subpage
        if (
            properties[lastColumn].title &&
            properties[lastColumn].title.length
        ) {
            const name: string = properties[lastColumn].title[0].text.content;
            return this.returnPage(name, pageId);
        }

        return null;
    }

    private returnPage(name: string, page_id: string): IPage {
        return {
            name,
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

    public async createNotionDatabase(token: string, data: object) {
        // return type we will create in next PR
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

            return {
                name: response.data.title[0]?.text?.content || "Untitled",
                link: response.data.url,
            };
        } catch (err) {
            throw new AppsEngineException(err as string);
        }
    }
}
