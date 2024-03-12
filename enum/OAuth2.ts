export enum OAuth2Locator {
    authUri = "https://api.notion.com/v1/oauth/authorize?owner=user&response_type=code&",
    accessTokenUrl = "https://api.notion.com/v1/oauth/token",
    refreshTokenUrl = "https://api.notion.com/v1/oauth/token",
    redirectUrlPath = "/api/apps/public/fb6e4e74-f99d-41b6-96da-2486e9aafea8/webhook",
}

export enum OAuth2Content {
    success = "https://github.com/RocketChat/Apps.Notion/assets/78961432/01cc6f3d-f29d-41d5-9024-96199c7de419",
    failed = "/assets/logo.png",
    NOT_CONNECTED_MESSAGE = `You are not connected to **Workspace**!`,
    NOT_CONNECTED_MESSAGE_WITH_INFO = `Connect to workspace to access \`pages\` & \`database\``,
    CONNECT_TO_WORKSPACE = "Connect to Workspace",
    CREDENTIALS_MISSING_USER = `Something Went Wrong, Please Contact the Admin!`,
    CREDENTIALS_MISSING_ADMIN = `Please Configure the App and Ensure the \`SiteUrl\` is correct in the Server Settings.
            \xa0\xa0• Go to **NotionApp** Settings and add \`ClientId\` and \`ClientSecret\` Generated from a Notion Public Integration
            `,
}

export enum OAuth2Credential {
    TYPE = "Basic",
    GRANT_TYPE = "authorization_code",
    FORMAT = "base64",
    CLIENT_ID = "client_id",
    REDIRECT_URI = "redirect_uri",
    STATE = "state",
}

export enum OAuth2Block {
    CONNECT_TO_WORKSPACE = "connect-to-workspace-block",
}

export enum OAuth2Action {
    CONNECT_TO_WORKSPACE = "connect-to-workspace-action",
}
