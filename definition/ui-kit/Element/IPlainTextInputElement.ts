import { PlainTextInputElement } from "@rocket.chat/ui-kit";
export type PlainTextInputParam = Omit<
    PlainTextInputElement,
    "type" | "placeholder" | "appId" | "blockId" | "actionId"
> & { text: string };
