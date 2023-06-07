import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { PreviewBlockWithPreview, PreviewBlock } from "@rocket.chat/ui-kit";
import { ElementBuilder } from "../lib/ElementBuilder";
import { BlockBuilder } from "../lib/BlockBuilder";
import { Notion } from "../../enum/Notion";

export function getConnectPreview(
    appId: string,
    tokenInfo: ITokenInfo
): Exclude<PreviewBlock, PreviewBlockWithPreview> {
    const { workspace_name, workspace_icon, owner } = tokenInfo;
    const { name, avatar_url } = owner.user;

    const elementBuilder = new ElementBuilder(appId);
    const blockBuilder = new BlockBuilder(appId);

    const workspace_icon_url = workspace_icon?.startsWith("/")
        ? `${Notion.WEBSITE_URL}${workspace_icon}`
        : workspace_icon?.startsWith("http")
        ? `${workspace_icon}`
        : undefined;
    const thumb = workspace_icon_url ? { url: workspace_icon_url } : undefined;
    const title = [
        `**📚 [**${workspace_name}**](${Notion.WEBSITE_URL})**`,
        "**👋 Connected to Workspace**",
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
