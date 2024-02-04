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
    let properties: object | undefined;
    let addedProperty: { data: Array<object> } | undefined;
    let allUsers: object | undefined;

    if (parent) {
        properties = await modalInteraction.getInputElementState(
            SearchPageAndDatabase.ACTION_ID
        );

        addedProperty = await modalInteraction.getAllInteractionActionId();

        allUsers = await modalInteraction.getInputElementState(
            PropertyTypeValue.PEOPLE
        );
    }

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
        labelOfPageOrRecord = `${label} *`;
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

            blocks.push(divider);
        });
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
