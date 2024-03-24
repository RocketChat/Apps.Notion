import {
    HttpStatusCode,
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ApiEndpoint,
    IApiEndpointInfo,
    IApiRequest,
    IApiResponse,
} from "@rocket.chat/apps-engine/definition/api";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { URL } from "url";
import {
    OAuth2Content,
    OAuth2Credential,
    OAuth2Locator,
} from "../../enum/OAuth2";
import { ClientError } from "../../errors/Error";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { getCredentials } from "../helper/getCredential";
import { sendNotification } from "../helper/message";
import { BlockBuilder } from "../lib/BlockBuilder";
import { NotionSDK } from "../lib/NotionSDK";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { getConnectPreview } from "../helper/getConnectLayout";
import { getAuthPageTemplate } from "../helper/getAuthPageTemplate";

export class WebHookEndpoint extends ApiEndpoint {
    public path: string = "webhook";
    public url_path: string = OAuth2Locator.redirectUrlPath;
    public accessTokenUrl: string = OAuth2Locator.accessTokenUrl;
    public async get(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<IApiResponse> {
        const { code, state, error } = request.query;

        const customHeader = {
            "Content-Security-Policy": "script-src 'unsafe-inline'",
        };
        const failedTemplate = getAuthPageTemplate(
            "failure",
            "Something Went Wrong",
            OAuth2Content.failed,
            "🚫 Something went wrong while connecting to the workspace.",
            "Please try again. If it still does not work, please contact the administrator.",
            2,
            "Window will be closed in {seconds}"
        );

        // incase when user leaves in between the auth process
        if (error) {
            this.app.getLogger().warn(error);
            return {
                status: HttpStatusCode.UNAUTHORIZED,
                headers: customHeader,
                content: failedTemplate,
            };
        }

        const user = await read.getUserReader().getById(state);
        // incase when user changed the state in authUrl
        if (!user) {
            this.app
                .getLogger()
                .warn(`User not found before access token request`);
            return {
                status: HttpStatusCode.NON_AUTHORITATIVE_INFORMATION,
                headers: customHeader,
                content: failedTemplate,
            };
        }

        const persistenceRead = read.getPersistenceReader();
        const roomInteraction = new RoomInteractionStorage(
            persis,
            persistenceRead,
            user.id
        );
        const roomId = await roomInteraction.getInteractionRoomId();
        const room = (await read.getRoomReader().getById(roomId)) as IRoom;

        const appCredentials = await getCredentials(read, modify, user, room);
        // incase there is no credentials in between auth interaction
        if (!appCredentials) {
            return {
                status: HttpStatusCode.UNAUTHORIZED,
                headers: customHeader,
                content: failedTemplate,
            };
        }

        const { clientId, clientSecret, siteUrl } = appCredentials;
        const redirectUrl = new URL(this.url_path, siteUrl);
        const credentials = new Buffer(`${clientId}:${clientSecret}`).toString(
            OAuth2Credential.FORMAT
        );

        const notionSDK = new NotionSDK(http);
        const response = await notionSDK.createToken(
            redirectUrl,
            code,
            credentials
        );

        // incase there is some error in creation of Token from Notion
        if (response instanceof ClientError) {
            this.app.getLogger().warn(response.message);
            return {
                status: response.statusCode,
                headers: customHeader,
                content: failedTemplate,
            };
        }

        const successTemplate = getAuthPageTemplate(
            "success",
            "Connected to Workspace.",
            OAuth2Content.success,
            `👋 Connected to ${response.workspace_name}`,
            "You can now close this window.",
            2,
            "Window will be closed in {seconds}"
        );

        const oAuth2Storage = new OAuth2Storage(persis, persistenceRead);
        await oAuth2Storage.connectUserToWorkspace(response, state);

        const connectPreview = getConnectPreview(this.app.getID(), response);
        await sendNotification(read, modify, user, room, {
            blocks: [connectPreview],
        });
        await roomInteraction.clearInteractionRoomId();
        return {
            status: 200,
            headers: customHeader,
            content: successTemplate,
        };
    }
}
