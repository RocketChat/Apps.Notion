import { InputBlock } from "@rocket.chat/ui-kit";
export type InputBlockParam = Omit<InputBlock, "type" | "appId" | "label"> & {
    text: string;
};
