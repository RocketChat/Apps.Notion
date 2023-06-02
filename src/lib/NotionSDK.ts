import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { INotionSDK } from "../../definition/lib/INotion";
import { IHttp, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { URL } from "url";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { ClientError } from "../../errors/Error";
import { NotionApi } from "../../enum/Notion";
import { OAuth2Credential, OAuth2Locator } from "../../enum/OAuth2";
import { AppsEngineException } from "@rocket.chat/apps-engine/definition/exceptions";
import { getCredentials } from "../helper/getCredential";

export class NotionSDK implements INotionSDK {
    baseUrl: string;
    NotionVersion: string;
    constructor() {
        this.baseUrl = NotionApi.BASE_URL;
        this.NotionVersion = NotionApi.VERSION;
    }
    public async getAuthorizationUrl(
        user: IUser,
        read: IRead
    ): Promise<string> {
        const userId = user.id;
        const { clientId, siteUrl } = await getCredentials(read);

        const redirectUrl = new URL(OAuth2Locator.redirectUrlPath, siteUrl);
        const authorizationUrl = new URL(OAuth2Locator.authUri);
        authorizationUrl.searchParams.set(OAuth2Credential.CLIENT_ID, clientId);
        authorizationUrl.searchParams.set(
            OAuth2Credential.REDIRECT_URI,
            redirectUrl.toString()
        );
        authorizationUrl.searchParams.set(OAuth2Credential.STATE, userId);

        return authorizationUrl.toString();
    }

    public async createToken(
        http: IHttp,
        redirectUrl: URL,
        code: string,
        credentials: string
    ): Promise<ITokenInfo | ClientError> {
        try {
            const response = await http.post(OAuth2Locator.accessTokenUrl, {
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
