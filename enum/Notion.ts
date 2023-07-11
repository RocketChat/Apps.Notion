export enum NotionTokenType {
    TOKEN_TYPE = "bearer",
    CURRENT_WORKSPACE = "notion_current_workspace",
}

export enum NotionOwnerType {
    USER = "user",
    PERSON = "person",
    BOT = "bot",
}

export enum NotionApi {
    BASE_URL = "https://api.notion.com/v1",
    VERSION = "2022-06-28",
    USER_AGENT = "Rocket.Chat-Apps-Engine",
    CONTENT_TYPE = "application/json",
    SEARCH = `https://api.notion.com/v1/search`,
    CREATE_DATABASE = `https://api.notion.com/v1/databases`,
}

export enum Notion {
    WEBSITE_URL = "https://www.notion.so",
}

export enum NotionObjectTypes {
    TYPE = "type",
    PAGE = "page",
    PAGE_ID = "page_id",
    WORKSPACE = "workspace",
    PROPERTY = "object",
    TEXT = "text",
    FORMAT = "format",
    EXPRESSION = "expression",
    UNTITLED = "Untitled",
}
