import { SectionBlock, ActionsBlock } from "@rocket.chat/ui-kit";
import { SectionBlockParam } from "./ISectionBlock";
import { ActionBlockParam } from "./IActionBlock";

export interface IBlockBuilder {
    createSectionBlock(param: SectionBlockParam): SectionBlock;
    createActionBlock(param: ActionBlockParam): ActionsBlock;
}
