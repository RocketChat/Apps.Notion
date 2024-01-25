import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { PreviewBlockWithPreview, PreviewBlock } from "@rocket.chat/ui-kit";
import { ElementBuilder } from "../lib/ElementBuilder";
import { BlockBuilder } from "../lib/BlockBuilder";
import { Notion } from "../../enum/Notion";
import { INotionDatabase } from "../../definition/lib/INotion";

export function getSelectDatabaseLayout(
    appId: string,
    tokenInfo: ITokenInfo,
    properties: INotionDatabase
): Exclude<PreviewBlock, PreviewBlockWithPreview> {
    const { workspace_icon, owner } = tokenInfo;
    const { name, avatar_url } = owner.user;

    const database_name = properties.name.replace("📚 ", "");
    const database_url = properties.link;

    const elementBuilder = new ElementBuilder(appId);
    const blockBuilder = new BlockBuilder(appId);

    const workspace_icon_url = workspace_icon?.startsWith("/")
        ? `${Notion.WEBSITE_URL}${workspace_icon}`
        : workspace_icon?.startsWith("http")
        ? `${workspace_icon}`
        : undefined;
    const thumb = workspace_icon_url ? { url: workspace_icon_url } : undefined;
    const title = [
        `**Database Name**`,
        `[**${database_name}**](${database_url})`,
    ];
    const description = [""];
    const avatarElement = elementBuilder.addImage({
        imageUrl: avatar_url as string,
        altText: name as string,
    });
    const avatarName = `**${name}**`;
    const footer = blockBuilder.createContextBlock({
        contextElements: [avatarElement, avatarName],
    });

    const connectPreview = blockBuilder.createPreviewBlock({
        title,
        description,
        footer,
        thumb,
    });

    return connectPreview;
}
