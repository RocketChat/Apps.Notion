import { InputBlock } from "@rocket.chat/ui-kit";
import { NotionApp } from "../../../NotionApp";
export function inputElementComponent(
    {
        app,
        placeholder,
        label,
        optional,
        multiline,
        minLength,
        maxLength,
    }: {
        app: NotionApp;
        placeholder: string;
        label: string;
        optional?: boolean;
        multiline?: boolean;
        minLength?: number;
        maxLength?: number;
    },
    { blockId, actionId }: { blockId: string; actionId: string }
): InputBlock {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const plainTextInputElement = elementBuilder.createPlainTextInput(
        { text: placeholder, multiline, minLength, maxLength },
        {
            blockId,
            actionId,
        }
    );

    const plainTextInputBlock = blockBuilder.createInputBlock({
        text: label,
        element: plainTextInputElement,
        optional,
    });

    return plainTextInputBlock;
}
