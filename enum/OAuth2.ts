export enum OAuth2Locator {
    authUri = "https://api.notion.com/v1/oauth/authorize?owner=user&response_type=code&",
    accessTokenUrl = "https://api.notion.com/v1/oauth/token",
    refreshTokenUrl = "https://api.notion.com/v1/oauth/token",
    redirectUrlPath = "/api/apps/public/fb6e4e74-f99d-41b6-96da-2486e9aafea8/webhook",
}

export enum OAuth2Content {
    success = "https://github-production-user-asset-6210df.s3.amazonaws.com/65061890/243671111-9964efff-3b23-4223-aadd-5f4be441037c.svg",
    failed = "https://open.rocket.chat/assets/logo.png",
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
