export enum NotionTokenType {
    TOKEN_TYPE = "bearer",
    CURRENT_WORKSPACE = "notion_current_workspace",
    ALL_CONNECTED_WORKSPACES = "notion_all_connected_workspaces",
}

export enum NotionOwnerType {
    USER = "user",
    PERSON = "person",
    BOT = "bot",
    ME = "me",
}

export enum NotionApi {
    BASE_URL = "https://api.notion.com/v1",
    VERSION = "2022-06-28",
    USER_AGENT = "Rocket.Chat-Apps-Engine",
    CONTENT_TYPE = "application/json",
    SEARCH = `https://api.notion.com/v1/search`,
    CREATE_DATABASE = `https://api.notion.com/v1/databases`,
    COMMENTS = `https://api.notion.com/v1/comments`,
    USERS = `https://api.notion.com/v1/users`,
    PAGES = `https://api.notion.com/v1/pages`,
    BLOCKS = `https://api.notion.com/v1/blocks`,
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
    COMMENT = "comment",
    PARENT = "parent",
    MENTION = "mention",
    DATABASE_ID = "database_id",
    OBJECT = "object",
    TITLE = "title",
    INFO = "info",
    NAME = "name",
    PROPERTIES = "properties",
    ID = "id",
    DATABASE = "database",
}
