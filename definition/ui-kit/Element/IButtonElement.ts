import { ButtonElement } from "@rocket.chat/ui-kit";

export type ButtonParam = Pick<ButtonElement, "value" | "style" | "url"> & {
    text: string;
};
