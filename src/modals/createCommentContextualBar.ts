import {
    IModify,
    IPersistence,
    IRead,
    IUIKitSurfaceViewParam,
} from "@rocket.chat/apps-engine/definition/accessors";
import { NotionApp } from "../../NotionApp";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { Error } from "../../errors/Error";
import { searchPageComponent } from "./common/searchPageComponent";
import {
    Block,
    TextObjectType,
    ContextBlock,
    SectionBlock,
} from "@rocket.chat/ui-kit";
import { CommentPage } from "../../enum/modals/CommentPage";
import {
    ButtonStyle,
    UIKitSurfaceType,
} from "@rocket.chat/apps-engine/definition/uikit";
import { inputElementComponent } from "./common/inputElementComponent";
import { OverflowMenuComponent } from "./common/OverflowMenuComponent";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { NotionObjectTypes } from "../../enum/Notion";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";
import { Modals } from "../../enum/modals/common/Modals";
import { ButtonInActionComponent } from "./common/buttonInActionComponent";
import { uuid } from "../helper/uuid";
import { ButtonInSectionComponent } from "./common/buttonInSectionComponent";
import { ICommentInfo } from "../../definition/lib/INotion";
import { getTimeAgoFromISO } from "../helper/getTimeAgoFromISO";

export async function createCommentContextualBar(
    app: NotionApp,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    room: IRoom,
    tokenInfo: ITokenInfo,
    modalInteraction: ModalInteractionStorage,
    pageId?: string,
    refresh?: boolean
): Promise<IUIKitSurfaceViewParam | Error> {
    const { elementBuilder, NotionSdk, blockBuilder } = app.getUtils();
    const searchForPageComponent = await searchPageComponent(
        app,
        modalInteraction,
        tokenInfo,
        SearchPage.SEARCH_COMMENT_ACTION_ID
    );

    if (searchForPageComponent instanceof Error) {
        return searchForPageComponent;
    }

    const blocks: Block[] = [];

    if (pageId) {
        const overflowMenu = await OverflowMenuComponent(
            {
                app,
                text: [CommentPage.REFRESH_OPTION_TEXT],
                value: [pageId],
            },
            {
                blockId: Modals.OVERFLOW_MENU_BLOCK,
                actionId: Modals.OVERFLOW_MENU_ACTION,
            }
        );

        blocks.push(overflowMenu);
    }

    let commentText: object | undefined;
    if (pageId) {
        commentText = await modalInteraction.getInputElementState(
            CommentPage.COMMENT_INPUT_ACTION
        );
    }

    const commentMultiLineInput = inputElementComponent(
        {
            app,
            placeholder: CommentPage.COMMENT_INPUT_PLACEHOLDER,
            label: CommentPage.COMMENT_INPUT_LABEL,
            optional: false,
            multiline: true,
            dispatchActionConfigOnInput: true,
            initialValue: commentText
                ? commentText?.[NotionObjectTypes.COMMENT]
                : undefined,
        },
        {
            actionId: CommentPage.COMMENT_INPUT_ACTION,
            blockId: CommentPage.COMMENT_INPUT_BLOCK,
        }
    );

    const divider = blockBuilder.createDividerBlock();

    const commentOnPageButton = ButtonInSectionComponent(
        {
            app,
            buttonText: CommentPage.SUBMIT_BUTTON_TEXT,
            style: ButtonStyle.PRIMARY,
            value: pageId,
        },
        {
            actionId: CommentPage.COMMENT_ON_PAGE_SUBMIT_ACTION,
            blockId: CommentPage.COMMENT_ON_PAGE_SUBMIT_BLOCK,
        }
    );

    const mandatoryBlocks: Block[] = [
        searchForPageComponent,
        commentMultiLineInput,
        commentOnPageButton,
        divider,
    ];

    blocks.push(...mandatoryBlocks);

    const { access_token } = tokenInfo;

    if (pageId) {
        let commentsInfo: object | undefined | ICommentInfo[] | Error;
        let comments: ICommentInfo[] = [];

        if (!refresh) {
            commentsInfo = await modalInteraction.getInputElementState(
                CommentPage.REFRESH_OPTION_VALUE
            );
        }

        if (!commentsInfo) {
            commentsInfo = await NotionSdk.retrieveCommentsOnpage(
                pageId,
                access_token
            );

            if (!(commentsInfo instanceof Error)) {
                await modalInteraction.storeInputElementState(
                    CommentPage.REFRESH_OPTION_VALUE,
                    {
                        data: commentsInfo,
                    }
                );

                comments = commentsInfo as ICommentInfo[];
            }
        } else {
            comments = commentsInfo?.[Modals.DATA] as ICommentInfo[];
        }

        comments.forEach((commentInfo) => {
            const avatarElement = elementBuilder.addImage({
                imageUrl:
                    commentInfo.user.avatar_url ||
                    `https://open.rocket.chat/avatar/${commentInfo.user.name}}`,
                altText: "",
            });
            const formattedTime = getTimeAgoFromISO(commentInfo.created_time);
            const userName = `**${commentInfo.user.name}** ${formattedTime}`;

            const NameWithCreatedTime = blockBuilder.createContextBlock({
                contextElements: [avatarElement, userName],
            });

            const commentSection: SectionBlock =
                blockBuilder.createSectionBlock({
                    text: commentInfo.comment,
                });

            blocks.push(NameWithCreatedTime, commentSection, divider);
        });
    }

    const close = elementBuilder.addButton(
        { text: CommentPage.CLOSE_BUTTON_TEXT, style: ButtonStyle.DANGER },
        {
            actionId: CommentPage.COMMENT_ON_PAGE_CLOSE_ACTION,
            blockId: CommentPage.COMMENT_ON_PAGE_CLOSE_BLOCK,
        }
    );

    return {
        id: CommentPage.VIEW_ID,
        type: UIKitSurfaceType.CONTEXTUAL_BAR,
        title: {
            type: TextObjectType.MRKDWN,
            text: CommentPage.TITLE,
        },
        blocks,
        close,
    };
}
