import { StaticSelectElement } from "@rocket.chat/ui-kit";

export type StaticSelectElementParam = Pick<
    StaticSelectElement,
    | "options"
    | "optionGroups"
    | "initialOption"
    | "initialValue"
    | "dispatchActionConfig"
> & { placeholder: string };

export type StaticSelectOptionsParam = Array<{
    text: string;
    value: string;
    description?: string;
    url?: string;
}>;
