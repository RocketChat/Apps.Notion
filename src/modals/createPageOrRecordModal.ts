import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { NotionApp } from "../../NotionApp";
import {
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { Error } from "../../errors/Error";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { TextObjectType, Block } from "@rocket.chat/ui-kit";
import { getConnectPreview } from "../helper/getConnectLayout";
import { inputElementComponent } from "./common/inputElementComponent";
import { searchPageOrDatabaseComponent } from "./common/searchPageOrDatabaseComponent";
import { SearchPageAndDatabase } from "../../enum/modals/common/SearchPageAndDatabaseComponent";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { OverflowMenuComponent } from "./common/OverflowMenuComponent";
import { Modals } from "../../enum/modals/common/Modals";
import { IDatabase } from "../../definition/lib/INotion";
import { getSelectDatabaseLayout } from "../helper/getSelectDatabaseLayout";
import { getTitleProperty } from "../helper/getTitleProperty";
import { ButtonInSectionComponent } from "./common/buttonInSectionComponent";
import { DropDownComponent } from "./common/DropDownComponent";
import { NotionObjectTypes } from "../../enum/Notion";
import { getNonSelectedOptions } from "../helper/getNonSelectedOptions";
import { IsNonSelectedOptionExist } from "../helper/IsNonSelectedOptionExist";
import { getPropertySelectedElement } from "../helper/getPropertySelectedElement";
import { PropertyTypeValue } from "../../enum/modals/common/NotionProperties";

export async function createPageOrRecordModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    parent?: IDatabase,
    addPropertyAction?: boolean
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder, blockBuilder } = app.getUtils();
    const divider = blockBuilder.createDividerBlock();
    const blocks: Block[] = [];
    const appId = app.getID();
    const overFlowMenuText = [DatabaseModal.OVERFLOW_MENU_TEXT.toString()];
    const overFlowMenuValue = [DatabaseModal.OVERFLOW_MENU_ACTION.toString()];
    let properties: object | undefined;
    let addedProperty: { data: Array<object> } | undefined;
    let propertiesId: object | undefined;
    let allUsers: object | undefined;

    if (parent) {
        properties = await modalInteraction.getInputElementState(
            SearchPageAndDatabase.ACTION_ID
        );

        addedProperty = await modalInteraction.getAllInteractionActionId();

        propertiesId = await modalInteraction.getInputElementState(
            NotionObjectTypes.PROPERTIES
        );

        allUsers = await modalInteraction.getInputElementState(
            PropertyTypeValue.PEOPLE
        );
    }

    if (parent) {
        overFlowMenuText.push(
            NotionPageOrRecord.CHANGE_DATABASE_TEXT.toString()
        );
        overFlowMenuValue.push(
            NotionPageOrRecord.CHANGE_DATABASE_ACTION.toString()
        );
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

    blocks.push(overflowMenu);
    if (!parent) {
        const connectBlock = getConnectPreview(appId, tokenInfo);
        blocks.push(connectBlock);
    }

    if (!parent) {
        const SearchForPageOrDatabaseComponent =
            await searchPageOrDatabaseComponent(
                app,
                modalInteraction,
                tokenInfo,
                SearchPageAndDatabase.ACTION_ID
            );

        if (SearchForPageOrDatabaseComponent instanceof Error) {
            return SearchForPageOrDatabaseComponent;
        }

        blocks.push(SearchForPageOrDatabaseComponent);
    } else {
        const { info } = parent;
        const SelectedDatabaseLayout = getSelectDatabaseLayout(
            appId,
            tokenInfo,
            info
        );

        blocks.push(SelectedDatabaseLayout);
    }
    let labelOfPageOrRecord = NotionPageOrRecord.TITLE_LABEL.toString();
    let placeholderOfPageOrRecord =
        NotionPageOrRecord.TITLE_PLACEHOLDER.toString();

    if (parent && properties) {
        const { label, placeholder } = await getTitleProperty(properties);
        labelOfPageOrRecord = label;
        placeholderOfPageOrRecord = placeholder;
    }

    const titleOfPageOrRecordBlock = inputElementComponent(
        {
            app,
            placeholder: placeholderOfPageOrRecord,
            label: labelOfPageOrRecord,
            optional: false,
        },
        {
            blockId: NotionPageOrRecord.TITLE_BLOCK,
            actionId: NotionPageOrRecord.TITLE_ACTION,
        }
    );

    blocks.push(titleOfPageOrRecordBlock);

    if (parent && addedProperty) {
        const data = addedProperty.data;
        data.forEach(async (item, index) => {
            if (index === 0) {
                blocks.push(divider);
            }
            const propertySelectActionId: string = item?.[Modals.PROPERTY];
            const options = getNonSelectedOptions(
                properties as object,
                item,
                parent,
                propertiesId as object
            );

            const propertySelectBlock = DropDownComponent(
                {
                    app,
                    options,
                    placeholder: NotionPageOrRecord.PROPERTY_PLACEHOLDER,
                    text: NotionPageOrRecord.PROPERTY_LABEL,
                    dispatchActionConfigOnSelect: true,
                },
                {
                    blockId: NotionPageOrRecord.PROPERTY_BLOCK,
                    actionId: propertySelectActionId,
                }
            );

            blocks.push(propertySelectBlock);

            const selectedPropertyTypeElementActionId = item?.[Modals.VALUE];
            if (selectedPropertyTypeElementActionId) {
                const PropertySelectedElement = getPropertySelectedElement(
                    app,
                    selectedPropertyTypeElementActionId,
                    item,
                    modalInteraction,
                    allUsers
                );

                blocks.push(PropertySelectedElement);
            }

            const removeButton = ButtonInSectionComponent(
                {
                    app,
                    buttonText: NotionPageOrRecord.REMOVE_PROPERTY_BUTTON_TEXT,
                    value: JSON.stringify({
                        parent,
                        propertyObject: item,
                    }),
                },
                {
                    blockId: NotionPageOrRecord.REMOVE_PROPERTY_BLOCK,
                    actionId: NotionPageOrRecord.REMOVE_PROPERTY_ACTION,
                }
            );

            blocks.push(removeButton);
            blocks.push(divider);
        });
    }

    if (parent && properties && !addPropertyAction) {
        const isNonSelectedOptionExist = IsNonSelectedOptionExist(
            propertiesId as object
        );

        if (isNonSelectedOptionExist) {
            const addProperty = ButtonInSectionComponent(
                {
                    app,
                    buttonText: NotionPageOrRecord.ADD_PROPERTY_BUTTON_TEXT,
                    value: JSON.stringify(parent),
                },
                {
                    blockId: NotionPageOrRecord.ADD_PROPERTY_BLOCK,
                    actionId: NotionPageOrRecord.ADD_PROPERTY_ACTION,
                }
            );

            blocks.push(addProperty);
        }
    }
    const submit = elementBuilder.addButton(
        { text: NotionPageOrRecord.CREATE, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionPageOrRecord.CREATE_ACTION,
            blockId: NotionPageOrRecord.CREATE_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionPageOrRecord.CLOSE, style: ButtonStyle.DANGER },
        {
            actionId: NotionPageOrRecord.CLOSE_ACTION,
            blockId: NotionPageOrRecord.CLOSE_BLOCK,
        }
    );

    return {
        id: NotionPageOrRecord.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionPageOrRecord.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
