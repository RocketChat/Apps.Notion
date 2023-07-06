import { INotionUser } from "../../definition/authorization/IOAuth2Storage";
import { NotionObjectTypes, NotionOwnerType } from "../../enum/Notion";
import { Color } from "../../enum/modals/common/NotionProperties";

const annotations = {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: Color.DEFAULT,
};
export function getMentionObject(user: INotionUser, name: string | null) {
    return {
        type: NotionObjectTypes.MENTION,
        mention: {
            type: NotionOwnerType.USER,
            user,
        },
        annotations,
        plain_text: `@${name}`,
        href: null,
    };
}

export function getWhiteSpaceTextObject() {
    return {
        type: NotionObjectTypes.TEXT,
        text: {
            content: " ",
        },
        annotations,
        plain_text: " ",
        href: null,
    };
}
