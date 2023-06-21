import { INotionSDK } from "../../definition/lib/INotion";
import { IHttp } from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { ClientError } from "../../errors/Error";
import { NotionApi } from "../../enum/Notion";
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
            const response = await this.http.post(OAuth2Locator.accessTokenUrl, {
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
            });

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
}
