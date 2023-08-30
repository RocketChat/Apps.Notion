import { DatePickerElement } from "@rocket.chat/ui-kit";

export type DatePickerElementParam = Omit<
    DatePickerElement,
    "type" | "placeholder" | "appId" | "blockId" | "actionId"
> & { text?: string };
