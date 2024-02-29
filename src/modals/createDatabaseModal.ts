import {
    IModify,
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
import { OverflowMenuComponent } from "./common/OverflowMenuComponent";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { DropDownComponent } from "./common/DropDownComponent";
import {
    getNumberPropertyFormat,
    getPropertyTypes,
    getSelectOptionColors,
} from "../helper/getPropertyTypes";
import { getConnectPreview } from "../helper/getConnectLayout";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { Modals } from "../../enum/modals/common/Modals";
import {
    Color,
    Number,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { NotionObjectTypes } from "../../enum/Notion";
import { ButtonInActionComponent } from "./common/buttonInActionComponent";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";

export async function createDatabaseModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const divider = blockBuilder.createDividerBlock();
    const connectBlock = getConnectPreview(app.getID(), tokenInfo);
    const overFlowMenuText = [
        NotionPageOrRecord.OVERFLOW_CHANGE_TO_PAGE_TEXT.toString(),
        DatabaseModal.OVERFLOW_CHANGE_WORKSPACE_TEXT.toString(),
    ];
    const overFlowMenuValue = [
        NotionPageOrRecord.OVERFLOW_CHANGE_TO_PAGE_ACTION.toString(),
        DatabaseModal.OVERFLOW_CHANGE_WORKSPACE_ACTION.toString(),
    ];

    const searchForPageComponent = await searchPageComponent(
        app,
        modalInteraction,
        tokenInfo,
        SearchPage.ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    const overflowMenu = await OverflowMenuComponent(
        {
            app,
            text: overFlowMenuText,
            value: overFlowMenuValue,
        },
        {
            blockId: Modals.OVERFLOW_MENU_BLOCK,
            actionId: Modals.OVERFLOW_MENU_ACTION,
        }
    );


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
            dispatchActionConfigOnInput: true,
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
        overflowMenu,
        connectBlock,
        searchForPageComponent,
        titleOfDatabaseBlock,
        titlePropertyOfDatabaseBlock,
    ];

    const records = await modalInteraction.getAllInteractionActionId();
    if (records) {
        records.data.forEach((record, index) => {
            let block: Block;
            if (index === 0) {
                blocks.push(divider);
            }
            const options = getPropertyTypes();
            block = DropDownComponent(
                {
                    app,
                    placeholder: DatabaseModal.PROPERTY_TYPE_SELECT_PLACEHOLDER,
                    text: DatabaseModal.PROPERTY_TYPE_SELECT_LABEL,
                    options,
                    dispatchActionConfigOnSelect: true,
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
                    dispatchActionConfigOnInput: true
                },
                {
                    blockId: DatabaseModal.PROPERTY_NAME_BLOCK,
                    actionId: record?.[DatabaseModal.PROPERTY_NAME],
                }
            );
            blocks.push(block);

            const configBlocks = addConfigPropertyTypeInteraction(record, app);
            blocks.push(...configBlocks);

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
            blocks.push(divider);
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

function addConfigPropertyTypeInteraction(record: object, app: NotionApp) {
    const config: object | undefined = record?.[Modals.ADDITIONAL_CONFIG];
    let blocks: Block[] = [];

    if (config) {
        const type: string = config?.[NotionObjectTypes.TYPE];
        switch (type) {
            case PropertyTypeValue.NUMBER: {
                const options = getNumberPropertyFormat();
                const initialValue = Number.NUMBER.toString();
                const actionId: string = config?.[Modals.DROPDOWN];
                const dropDown = DropDownComponent(
                    {
                        app,
                        placeholder:
                            DatabaseModal.NUMBER_PROPERTY_FORMAT_PLACEHOLDER,
                        text: DatabaseModal.NUMBER_PROPERTY_FORMAT_LABEL,
                        initialValue: initialValue,
                        options,
                    },
                    {
                        blockId: DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK,
                        actionId,
                    }
                );

                blocks.push(dropDown);
                break;
            }
            case PropertyTypeValue.FORMULA: {
                const actionId = config?.[Modals.INPUTFIELD];
                const inputField = inputElementComponent(
                    {
                        app,
                        placeholder: DatabaseModal.FORMULA_PLACEHOLDER,
                        label: DatabaseModal.FORMULA_LABEL,
                        optional: false,
                    },
                    {
                        blockId: DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK,
                        actionId,
                    }
                );
                blocks.push(inputField);
                break;
            }
            case PropertyTypeValue.MULTI_SELECT:
            case PropertyTypeValue.SELECT: {
                const options: Array<{
                    [Modals.INPUTFIELD]: string;
                    [Modals.DROPDOWN]: string;
                }> = config?.[Modals.OPTIONS];

                const colorOption = getSelectOptionColors();
                const initialValue = Color.DEFAULT.toString();

                options.forEach((option) => {
                    const actionIdInputField: string =
                        option?.[Modals.INPUTFIELD];
                    const actionIdDropDown: string = option?.[Modals.DROPDOWN];
                    const inputField = inputElementComponent(
                        {
                            app,
                            placeholder:
                                DatabaseModal.SELECT_PROPERTY_OPTION_PLACEHOLDER,
                            label: DatabaseModal.SELECT_PROPERTY_OPTION_LABEL,
                            optional: false,
                            dispatchActionConfigOnInput: true
                        },
                        {
                            blockId: DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK,
                            actionId: actionIdInputField,
                        }
                    );
                    blocks.push(inputField);

                    const dropDown = DropDownComponent(
                        {
                            app,
                            placeholder:
                                DatabaseModal.SELECT_PROPERTY_OPTION_COLOR_PLACEHOLDER,
                            text: DatabaseModal.SELECT_PROPERTY_OPTION_COLOR_LABEL,
                            initialValue: initialValue,
                            options: colorOption,
                        },
                        {
                            blockId: DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK,
                            actionId: actionIdDropDown,
                        }
                    );

                    blocks.push(dropDown);
                });

                if (options.length > 1) {
                    const removeOptionButton = ButtonInSectionComponent(
                        {
                            app,
                            buttonText: DatabaseModal.REMOVE_OPTION_BUTTON_TEXT,
                            style: ButtonStyle.DANGER,
                            value: record?.[DatabaseModal.PROPERTY_TYPE],
                        },
                        {
                            blockId: DatabaseModal.REMOVE_OPTION_BLOCK,
                            actionId: DatabaseModal.REMOVE_OPTION_ACTION,
                        }
                    );
                    blocks.push(removeOptionButton);
                }

                const optionButton = ButtonInActionComponent(
                    {
                        app,
                        buttonText: DatabaseModal.ADD_OPTION_BUTTON_TEXT,
                        style: ButtonStyle.PRIMARY,
                        value: record?.[DatabaseModal.PROPERTY_TYPE],
                    },
                    {
                        blockId: DatabaseModal.ADD_OPTION_BLOCK,
                        actionId: DatabaseModal.ADD_OPTION_ACTION,
                    }
                );

                blocks.push(optionButton);
                break;
            }
            default: {
            }
        }
    }

    return blocks;
}
