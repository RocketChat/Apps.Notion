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
import { NotionAppendContent } from "../../enum/modals/NotionAppendContent";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { TextObjectType, Block } from "@rocket.chat/ui-kit";
import { inputElementComponent } from "./common/inputElementComponent";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";
import { searchPageComponent } from "./common/searchPageComponent";
import { StaticSelectOptionsParam } from "../../definition/ui-kit/Element/IStaticSelectElement";
import { DropDownComponent } from "../modals/common/DropDownComponent";

export async function appendContentModal(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    modalInteraction: ModalInteractionStorage,
    tokenInfo: ITokenInfo,
    headingSelect?: boolean
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder } = app.getUtils();
    const blocks: Block[] = [];
    const searchForPageComponent = await searchPageComponent(
        app,
        modalInteraction,
        tokenInfo,
        SearchPage.ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    blocks.push(searchForPageComponent);

    const options: StaticSelectOptionsParam = [
        {
            text: "No Heading",
            value: "no_heading",
        },
        {
            text: "Heading 1",
            value: "heading_1",
        },
        {
            text: "Heading 2",
            value: "heading_2",
        },
        {
            text: "Heading 3",
            value: "heading_3",
        },
    ];

    const selectHeadingComponent = DropDownComponent(
        {
            app,
            options,
            placeholder: NotionAppendContent.HEADING_SELECT_PLACEHOLDER,
            text: NotionAppendContent.HEADING_SELECT_LABEL,
            initialValue: "no_heading",
            dispatchActionConfigOnInput: true,
            dispatchActionConfigOnSelect: true,
        },
        {
            blockId: NotionAppendContent.HEADING_SELECT_BLOCK_ID,
            actionId: NotionAppendContent.HEADING_SELECT_ACTION_ID,
        }
    );

    blocks.push(selectHeadingComponent);

    let labelofHeading = NotionAppendContent.HEADING_LABEL.toString();
    let placeholderofHeading =
        NotionAppendContent.HEADING_PLACEHOLDER.toString();

    const headingInput = inputElementComponent(
        {
            app,
            placeholder: placeholderofHeading,
            label: labelofHeading,
            optional: true,
        },
        {
            blockId: NotionAppendContent.HEADING_BLOCK,
            actionId: NotionAppendContent.HEADING_ACTION,
        }
    );

    if (headingSelect) blocks.push(headingInput);

    let labelOfAppendContent = NotionAppendContent.CONTENT_LABEL.toString();
    let placeholderOfAppendContent =
        NotionAppendContent.CONTENT_PLACEHOLDER.toString();

    const contentInput = inputElementComponent(
        {
            app,
            placeholder: placeholderOfAppendContent,
            label: labelOfAppendContent,
            optional: false,
            multiline: true,
        },
        {
            blockId: NotionAppendContent.CONTENT_BLOCK,
            actionId: NotionAppendContent.CONTENT_ACTION,
        }
    );

    blocks.push(contentInput);

    const submit = elementBuilder.addButton(
        { text: NotionAppendContent.SAVE, style: ButtonStyle.PRIMARY },
        {
            actionId: NotionAppendContent.SAVE_ACTION,
            blockId: NotionAppendContent.SAVE_BLOCK,
        }
    );

    const close = elementBuilder.addButton(
        { text: NotionAppendContent.CLOSE, style: ButtonStyle.DANGER },
        {
            actionId: NotionAppendContent.CLOSE_ACTION,
            blockId: NotionAppendContent.CLOSE_BLOCK,
        }
    );

    return {
        id: NotionAppendContent.VIEW_ID,
        type: UIKitSurfaceType.MODAL,
        title: {
            type: TextObjectType.MRKDWN,
            text: NotionAppendContent.TITLE,
        },
        blocks,
        close,
        submit,
    };
}
