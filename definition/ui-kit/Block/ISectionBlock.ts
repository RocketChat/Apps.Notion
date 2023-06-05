import { SectionBlock } from "@rocket.chat/ui-kit";

export type SectionBlockParam = Pick<SectionBlock, "accessory" | "blockId"> & {
    text?: string;
    fields?: Array<string>;
};
