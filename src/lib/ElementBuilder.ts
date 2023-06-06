import {
    ElementInteractionParam,
    IElementBuilder,
} from "../../definition/ui-kit/Element/IElementBuilder";
import {
    ButtonElement,
    BlockElementType,
    TextObjectType,
    ImageElement,
} from "@rocket.chat/ui-kit";
import { ButtonParam } from "../../definition/ui-kit/Element/IButtonElement";
import { ImageParam } from "../../definition/ui-kit/Element/IImageElement";

export class ElementBuilder implements IElementBuilder {
    constructor(private readonly appId: string) {}
    public addButton(
        param: ButtonParam,
        interaction: ElementInteractionParam
    ): ButtonElement {
        const { text, url, value, style } = param;
        const { blockId, actionId } = interaction;
        const button: ButtonElement = {
            type: BlockElementType.BUTTON,
            text: {
                type: TextObjectType.PLAIN_TEXT,
                text,
            },
            appId: this.appId,
            blockId,
            actionId,
            url,
            value,
            style,
        };
        return button;
    }

    public addImage(param: ImageParam): ImageElement {
        const { imageUrl, altText } = param;
        const image: ImageElement = {
            type: BlockElementType.IMAGE,
            imageUrl,
            altText,
        };
        return image;
    }
    
}
