export enum OAuth2Locator {
    authUri = "https://api.notion.com/v1/oauth/authorize?owner=user&response_type=code&",
    accessTokenUrl = "https://api.notion.com/v1/oauth/token",
    refreshTokenUrl = "https://api.notion.com/v1/oauth/token",
    redirectUrlPath = "/api/apps/public/fb6e4e74-f99d-41b6-96da-2486e9aafea8/webhook",
}

export enum OAuth2Content {
    success = '<div style="display: flex;align-items: center;justify-content: center; height: 100%;">\
                        <h1 style="text-align: center; font-family: Helvetica Neue;">\
                            Authorization went successfully<br>\
                            You can close this tab now<br>\
                        </h1>\
              </div>',
    failed = '<div style="display: flex;align-items: center;justify-content: center; height: 100%;">\
                    <h1 style="text-align: center; font-family: Helvetica Neue;">\
                        Oops, something went wrong, please try again or in case it still does not work, contact the administrator.\
                    </h1>\
             </div>',
}

export enum OAuth2Credential {
    TYPE = "Basic",
    GRANT_TYPE = "authorization_code",
    FORMAT = "base64",
    CLIENT_ID = "client_id",
    REDIRECT_URI = "redirect_uri",
    STATE = "state",
}
