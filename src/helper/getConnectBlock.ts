import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit";
import { Block } from "@rocket.chat/ui-kit";
import { NotionApp } from "../../NotionApp";
import { OAuth2Action, OAuth2Block, OAuth2Content } from "../../enum/OAuth2";

export async function getConnectBlock(
    app: NotionApp,
    message: string,
    url: string
): Promise<Array<Block>> {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const buttonElement = elementBuilder.addButton(
        {
            text: OAuth2Content.CONNECT_TO_WORKSPACE,
            style: ButtonStyle.PRIMARY,
            url,
        },
        {
            blockId: OAuth2Block.CONNECT_TO_WORKSPACE,
            actionId: OAuth2Action.CONNECT_TO_WORKSPACE,
        }
    );
    const actionBlock = blockBuilder.createActionBlock({
        elements: [buttonElement],
    });
    const textBlock = blockBuilder.createSectionBlock({
        text: message,
    });

    return [textBlock, actionBlock];
}
