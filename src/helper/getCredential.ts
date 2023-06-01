import { IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ICredential } from "../../definition/authorization/ICredential";
import { OAuth2Setting } from "../../config/settings";
import { ServerSetting } from "../../enum/Settings";

async function getCredentials(read: IRead): Promise<ICredential> {
    const clientId = (await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(OAuth2Setting.CLIENT_ID)) as string;
    const clientSecret = (await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(OAuth2Setting.CLIENT_SECRET)) as string;
    const siteUrl = (await read
        .getEnvironmentReader()
        .getServerSettings()
        .getValueById(ServerSetting.SITE_URL)) as string;

    return { clientId, clientSecret, siteUrl };
}
