import {
    SectionBlock,
    ActionsBlock,
    PreviewBlockBase,
    PreviewBlockWithThumb,
    ContextBlock,
    InputBlock,
    DividerBlock,
} from "@rocket.chat/ui-kit";
import { SectionBlockParam } from "./ISectionBlock";
import { ActionBlockParam } from "./IActionBlock";
import { PreviewBlockParam } from "./IPreviewBlock";
import { ContextBlockParam } from "./IContextBlock";
import { InputBlockParam } from "./IInputBlock";

export interface IBlockBuilder {
    createSectionBlock(param: SectionBlockParam): SectionBlock;
    createActionBlock(param: ActionBlockParam): ActionsBlock;
    createPreviewBlock(
        param: PreviewBlockParam
    ): PreviewBlockBase | PreviewBlockWithThumb;
    createContextBlock(param: ContextBlockParam): ContextBlock;
    createInputBlock(param: InputBlockParam): InputBlock;
    createDividerBlock(blockId?: string): DividerBlock;
}
