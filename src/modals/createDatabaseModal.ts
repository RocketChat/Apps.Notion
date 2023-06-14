import {
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { TextObjectType, Block } from "@rocket.chat/ui-kit";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { Error } from "../../errors/Error";
import { searchPageComponent } from "./common/searchPageComponent";
import { NotionApp } from "../../NotionApp";
import { inputElementComponent } from "./common/inputElementComponent";
import { ButtonInSectionComponent } from "./common/buttonInSectionComponent";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { DropDownComponent } from "./common/DropDownComponent";
import { getPropertyTypes } from "../helper/getPropertyTypes";

export async function createDatabaseModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder } = app.getUtils();

    const searchForPageComponent = await searchPageComponent(
        app,
        modalInteraction,
        tokenInfo
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    const titleOfDatabaseBlock = inputElementComponent(
        {
            app,
            placeholder: DatabaseModal.TITLE_PLACEHOLDER,
            label: DatabaseModal.TITLE_LABEL,
            optional: false,
        },
        {
            blockId: DatabaseModal.TITLE_BLOCK,
            actionId: DatabaseModal.TITLE_ACTION,
        }
    );

    const titlePropertyOfDatabaseBlock = inputElementComponent(
        {
            app,
            placeholder: DatabaseModal.TITLE_PROPERTY_PLACEHOLDER,
            label: DatabaseModal.TITLE_PROPERTY_LABEL,
            optional: false,
        },
        {
            blockId: DatabaseModal.TITLE_PROPERTY_BLOCK,
            actionId: DatabaseModal.TITLE_PROPERTY_ACTION,
        }
    );

    const addPropertyButton = ButtonInSectionComponent(
        {
            app,
            buttonText: DatabaseModal.ADD_PROPERTY_BUTTON_TEXT,
        },
        {
            blockId: DatabaseModal.ADD_PROPERTY_BLOCK,
            actionId: DatabaseModal.ADD_PROPERTY_ACTION,
        }
    );
    const blocks: Block[] = [
        searchForPageComponent,
        titleOfDatabaseBlock,
        titlePropertyOfDatabaseBlock,
    ];

    const records = await modalInteraction.getAllInteractionActionId();
    if (records) {
        records.data.forEach((record) => {
            let block: Block;
            const options = getPropertyTypes();
            block = DropDownComponent(
                {
                    app,
                    placeholder: DatabaseModal.PROPERTY_TYPE_SELECT_PLACEHOLDER,
                    text: DatabaseModal.PROPERTY_TYPE_SELECT_LABEL,
                    options,
                },
                {
                    blockId: DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK,
                    actionId: record?.[DatabaseModal.PROPERTY_TYPE],
                }
            );

            blocks.push(block);

            block = inputElementComponent(
                {
                    app,
                    placeholder: DatabaseModal.PROPERTY_NAME_PLACEHOLDER,
                    label: DatabaseModal.PROPERTY_NAME_LABEL,
                    optional: false,
                },
                {
                    blockId: DatabaseModal.PROPERTY_NAME_BLOCK,
                    actionId: record?.[DatabaseModal.PROPERTY_NAME],
                }
            );
            blocks.push(block);

            block = ButtonInSectionComponent(
                {
                    app,
                    buttonText: DatabaseModal.REMOVE_PROPERTY_BUTTON_TEXT,
                    value: JSON.stringify(record),
                },
                {
                    blockId: DatabaseModal.REMOVE_PROPERTY_BLOCK,
                    actionId: DatabaseModal.REMOVE_PROPERTY_ACTION,
                }
            );

            blocks.push(block);
        });
    }

    blocks.push(addPropertyButton);

    const submit = elementBuilder.addButton(
        { text: DatabaseModal.CREATE, style: ButtonStyle.PRIMARY },
        {
            actionId: DatabaseModal.CREATE_ACTION,
            blockId: DatabaseModal.CREATE_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: DatabaseModal.CLOSE, style: ButtonStyle.DANGER },
        {
            actionId: DatabaseModal.CLOSE_ACTION,
            blockId: DatabaseModal.CLOSE_BLOCK,
        }
    );

    return {
        id: DatabaseModal.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: DatabaseModal.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
