import { MultiStaticSelectElement } from "@rocket.chat/ui-kit";
export type MultiStaticSelectElementParam = Omit<
    MultiStaticSelectElement,
    "type" | "blockId" | "actionId" | "placeholder" | "appId"
> & {
    text: string;
};
