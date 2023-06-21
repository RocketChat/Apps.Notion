import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ICredential } from "../../definition/authorization/ICredential";
import { OAuth2Setting } from "../../config/settings";
import { ServerSetting } from "../../enum/Settings";
import { sendNotification } from "./message";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function getCredentials(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom
): Promise<ICredential | null> {
    const clientId = (await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(OAuth2Setting.CLIENT_ID)) as string;
    const clientSecret = (await read
        .getEnvironmentReader()
        .getSettings()
        .getValueById(OAuth2Setting.CLIENT_SECRET)) as string;
    let siteUrl = (await read
        .getEnvironmentReader()
        .getServerSettings()
        .getValueById(ServerSetting.SITE_URL)) as string;

    if (
        !(
            clientId.trim().length &&
            clientSecret.trim().length &&
            siteUrl.trim().length
        )
    ) {
        // based on user role send relevant notification
        let message: string;
        if (user.roles.includes(ServerSetting.USER_ROLE_ADMIN)) {
            message = `Please Configure the App and Ensure the \`SiteUrl\` is correct in the Server Settings.
            \xa0\xa0• Go to **NotionApp** Settings and add \`ClientId\` and \`ClientSecret\` Generated from a Notion Public Integration
            `;
        } else {
            message = `🚫 Something Went Wrong, Please Contact the Admin!`;
        }

        await sendNotification(read, modify, user, room, {
            message,
        });

        return null;
    }

    if (siteUrl.endsWith("/")) {
        siteUrl = siteUrl.substring(0, siteUrl.length - 1);
    }

    return { clientId, clientSecret, siteUrl };
}
