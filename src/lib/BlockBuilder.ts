import { ActionBlockParam } from "../../definition/ui-kit/Block/IActionBlock";
import { IBlockBuilder } from "../../definition/ui-kit/Block/IBlockBuilder";
import { SectionBlockParam } from "../../definition/ui-kit/Block/ISectionBlock";
import {
    SectionBlock,
    LayoutBlockType,
    TextObjectType,
    TextObject,
    ActionsBlock,
} from "@rocket.chat/ui-kit";

export class BlockBuilder implements IBlockBuilder {
    constructor(private readonly appId: string) {}
    public createSectionBlock(param: SectionBlockParam): SectionBlock {
        const { text, blockId, fields, accessory } = param;
        const sectionBlock: SectionBlock = {
            appId: this.appId,
            blockId,
            type: LayoutBlockType.SECTION,
            text: {
                type: TextObjectType.MRKDWN,
                text: text ? text : "",
            },
            accessory,
            fields: fields ? this.createFields(fields) : undefined,
        };
        return sectionBlock;
    }
    public createActionBlock(param: ActionBlockParam): ActionsBlock {
        const { elements } = param;
        const actionBlock: ActionsBlock = {
            type: LayoutBlockType.ACTIONS,
            elements: elements,
        };
        return actionBlock;
    }

    private createFields(fields: Array<string>): Array<TextObject> {
        return fields.map((field) => {
            return {
                type: TextObjectType.MRKDWN,
                text: field,
            };
        });
    }
}
