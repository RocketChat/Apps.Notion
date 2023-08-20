import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { OAuth2Action } from "../../enum/OAuth2";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { uuid } from "../helper/uuid";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { createDatabaseModal } from "../modals/createDatabaseModal";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { Error } from "../../errors/Error";
import { sendNotificationWithConnectBlock } from "../helper/message";
import { PropertyTypeValue } from "../../enum/modals/common/NotionProperties";
import { Modals } from "../../enum/modals/common/Modals";
import { getDuplicatePropertyNameViewErrors } from "../helper/getDuplicatePropNameViewError";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";
import { createCommentContextualBar } from "../modals/createCommentContextualBar";
import { CommentPage } from "../../enum/modals/CommentPage";
import { NotionObjectTypes } from "../../enum/Notion";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import {
    ICommentInfo,
    IDatabase,
    IPage,
    IParentDatabase,
    IParentPage,
} from "../../definition/lib/INotion";
import { SearchPageAndDatabase } from "../../enum/modals/common/SearchPageAndDatabaseComponent";
import { Handler } from "./Handler";
import { createPageOrRecordModal } from "../modals/createPageOrRecordModal";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
import { NotionWorkspace } from "../../enum/modals/NotionWorkspace";
import { changeWorkspaceModal } from "../modals/changeWorkspaceModal";

export class ExecuteBlockActionHandler {
    private context: UIKitBlockInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitBlockInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { actionId, user, room, container, blockId } =
            this.context.getInteractionData();
        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id,
            container.id
        );

        const oAuth2Storage = new OAuth2Storage(
            this.persistence,
            persistenceRead
        );

        const roomInteractionStorage = new RoomInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id
        );

        switch (actionId) {
            case OAuth2Action.CONNECT_TO_WORKSPACE: {
                this.handleConnectToWorkspace(user, room);
                break;
            }
            case DatabaseModal.ADD_PROPERTY_ACTION: {
                this.handleAddPropertyAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case DatabaseModal.REMOVE_PROPERTY_ACTION: {
                this.handleRemovePropertyAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case DatabaseModal.REMOVE_OPTION_ACTION:
            case DatabaseModal.ADD_OPTION_ACTION: {
                this.handleOptionAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case SearchPage.SEARCH_COMMENT_ACTION_ID: {
                return this.handleViewCommentAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case CommentPage.COMMENT_ON_PAGE_SUBMIT_ACTION: {
                return this.handleCommentOnPage(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case CommentPage.COMMENT_INPUT_ACTION: {
                return this.handleCommentInputAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );

                break;
            }
            case Modals.OVERFLOW_MENU_ACTION: {
                return this.handleOverFlowMenuAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            case SearchPageAndDatabase.ACTION_ID: {
                return this.handleSearchPageAndDatabaseAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );

                break;
            }
            case NotionWorkspace.CHANGE_WORKSPACE_ACTION: {
                return this.handleChangeWorkspaceAction(
                    modalInteraction,
                    oAuth2Storage,
                    roomInteractionStorage
                );
                break;
            }
            default: {
                // Property Type Select Action
                const propertyTypeSelected =
                    DatabaseModal.PROPERTY_TYPE_SELECT_ACTION.toString();
                const isPropertyTypeDispatchAction =
                    actionId.startsWith(propertyTypeSelected);

                // Property Name Character Entered Action
                const propertyNameEntered =
                    DatabaseModal.PROPERTY_NAME_ACTION.toString();

                const titlePropertyNameEntered =
                    DatabaseModal.TITLE_PROPERTY_ACTION.toString();

                const isPropertyNameDispatchAction =
                    actionId.startsWith(propertyNameEntered) ||
                    actionId.startsWith(titlePropertyNameEntered);

                // Property Type Select Option Name Action

                const SelectPropertyOptionNameAction =
                    DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK.toString();

                const SelectPropertyOptionNameEntered =
                    DatabaseModal.SELECT_PROPERTY_OPTION_NAME.toString();

                const isSelectOptionNameDispatchAction = blockId.startsWith(
                    SelectPropertyOptionNameAction
                );

                const typeOfActionOccurred = isPropertyTypeDispatchAction
                    ? propertyTypeSelected
                    : isPropertyNameDispatchAction
                    ? propertyNameEntered
                    : isSelectOptionNameDispatchAction
                    ? SelectPropertyOptionNameEntered
                    : null;

                switch (typeOfActionOccurred) {
                    case DatabaseModal.PROPERTY_TYPE_SELECT_ACTION: {
                        this.handlePropertyTypeSelectAction(
                            modalInteraction,
                            oAuth2Storage,
                            roomInteractionStorage
                        );
                        break;
                    }
                    case DatabaseModal.PROPERTY_NAME_ACTION: {
                        return this.handleDuplicatePropertyNameAction(
                            modalInteraction
                        );
                        break;
                    }
                    case DatabaseModal.SELECT_PROPERTY_OPTION_NAME: {
                        break;
                    }
                    default: {
                    }
                }
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleConnectToWorkspace(
        user: IUser,
        room?: IRoom
    ): Promise<void> {
        const persistenceRead = this.read.getPersistenceReader();
        const roomId = room?.id as string;
        const roomInteraction = new RoomInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id
        );
        await roomInteraction.storeInteractionRoomId(roomId);
    }

    private async handleAddPropertyAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user } = this.context.getInteractionData();
        const PropertyName = `${DatabaseModal.PROPERTY_NAME_ACTION}-${uuid()}`;
        const PropertyType = `${
            DatabaseModal.PROPERTY_TYPE_SELECT_ACTION
        }-${uuid()}`;

        await modalInteraction.storeInteractionActionId({
            PropertyType,
            PropertyName,
        });

        this.handleUpdateofDatabaseModal(
            modalInteraction,
            oAuth2Storage,
            roomInteractionStorage
        );
    }

    private async handleRemovePropertyAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user, value } = this.context.getInteractionData();

        const record: object = JSON.parse(value as string);
        await modalInteraction.clearInteractionActionId(record);

        const RemovedFieldPropertyName: string =
            record?.[DatabaseModal.PROPERTY_NAME];

        const PropertyNameState = await modalInteraction.getInputElementState(
            DatabaseModal.PROPERTY_NAME
        );

        // removed field from property name state (which may have the state) if exists
        if (PropertyNameState) {
            delete PropertyNameState[RemovedFieldPropertyName];
            await modalInteraction.storeInputElementState(
                DatabaseModal.PROPERTY_NAME,
                PropertyNameState
            );
        }

        this.handleUpdateofDatabaseModal(
            modalInteraction,
            oAuth2Storage,
            roomInteractionStorage
        );
    }

    private async handleUpdateofDatabaseModal(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ) {
        const { user, triggerId } = this.context.getInteractionData();
        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return;
        }

        const modal = await createDatabaseModal(
            this.app,
            user,
            this.read,
            this.persistence,
            this.modify,
            room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Propably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        await this.modify.getUiController().updateSurfaceView(
            modal,
            {
                triggerId,
            },
            user
        );
    }

    private async handlePropertyTypeSelectAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<void> {
        const { value, actionId } = this.context.getInteractionData();
        const { data } = await modalInteraction.getAllInteractionActionId();
        const index = data.findIndex((record) => {
            return record?.[DatabaseModal.PROPERTY_TYPE] === actionId;
        });

        const PropertyType: string = data[index]?.[DatabaseModal.PROPERTY_TYPE];
        const PropertyName: string = data[index]?.[DatabaseModal.PROPERTY_NAME];

        const commonProperties = {
            PropertyType,
            PropertyName,
        };

        if (value) {
            switch (value) {
                case PropertyTypeValue.NUMBER: {
                    data[index] = {
                        ...commonProperties,
                        [Modals.ADDITIONAL_CONFIG]: {
                            type: value,
                            [Modals.DROPDOWN]: uuid(),
                        },
                    };
                    break;
                }
                case PropertyTypeValue.FORMULA: {
                    data[index] = {
                        ...commonProperties,
                        [Modals.ADDITIONAL_CONFIG]: {
                            type: value,
                            [Modals.INPUTFIELD]: uuid(),
                        },
                    };
                    break;
                }
                case PropertyTypeValue.MULTI_SELECT:
                case PropertyTypeValue.SELECT: {
                    data[index] = {
                        ...commonProperties,
                        [Modals.ADDITIONAL_CONFIG]: {
                            type: value,
                            [Modals.OPTIONS]: [
                                {
                                    [Modals.INPUTFIELD]: uuid(),
                                    [Modals.DROPDOWN]: uuid(),
                                },
                            ],
                        },
                    };
                    break;
                }
                default: {
                    data[index] = {
                        ...commonProperties,
                    };
                }
            }

            await modalInteraction.updateInteractionActionId(data);
            await this.handleUpdateofDatabaseModal(
                modalInteraction,
                oAuth2Storage,
                roomInteractionStorage
            );
        }
    }

    private async handleOptionAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<void> {
        const { value, actionId } = this.context.getInteractionData();
        if (value) {
            const { data } = await modalInteraction.getAllInteractionActionId();
            const index = data.findIndex((record) => {
                return record?.[DatabaseModal.PROPERTY_TYPE] === value;
            });

            const options: Array<{
                [Modals.INPUTFIELD]: string;
                [Modals.DROPDOWN]: string;
            }> = data[index]?.[Modals.ADDITIONAL_CONFIG]?.[Modals.OPTIONS];

            if (actionId.toString() === DatabaseModal.ADD_OPTION_ACTION) {
                options.push({
                    [Modals.INPUTFIELD]: uuid(),
                    [Modals.DROPDOWN]: uuid(),
                });
            } else {
                options.pop();
            }

            await modalInteraction.updateInteractionActionId(data);
            await this.handleUpdateofDatabaseModal(
                modalInteraction,
                oAuth2Storage,
                roomInteractionStorage
            );
        }
    }

    private async handleDuplicatePropertyNameAction(
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { container } = this.context.getInteractionData();

        const PropertyNameState = await this.handlePropertyNameState(
            modalInteraction
        );

        if (PropertyNameState) {
            const errors = await getDuplicatePropertyNameViewErrors(
                PropertyNameState
            );

            if (
                Object.keys(errors).length ||
                PropertyNameState[Modals.VIEWERROR]
            ) {
                return this.context
                    .getInteractionResponder()
                    .viewErrorResponse({
                        viewId: container.id,
                        errors,
                    });
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handlePropertyNameState(
        modalInteraction: ModalInteractionStorage
    ): Promise<object | undefined> {
        const { value, actionId, container } =
            this.context.getInteractionData();

        const inputElementState = await modalInteraction.getInputElementState(
            DatabaseModal.PROPERTY_NAME
        );

        // when there is no other state and the value is empty
        const noOtherStateAndEmptyValue = !value && inputElementState;

        if (noOtherStateAndEmptyValue) {
            if (Object.keys(inputElementState).length === 1) {
                delete inputElementState[actionId];

                await modalInteraction.clearInputElementState(
                    DatabaseModal.PROPERTY_NAME
                );
                return undefined;
            }
        }

        // when there is no state and character is entered
        const nullStateAndCharEntered = !inputElementState;

        if (nullStateAndCharEntered) {
            const state = { [actionId]: value, [Modals.VIEWERROR]: false };
            await modalInteraction.storeInputElementState(
                DatabaseModal.PROPERTY_NAME,
                state
            );
            return state;
        }

        const isViewErrorPreviously = await getDuplicatePropertyNameViewErrors(
            inputElementState
        );

        if (Object.keys(isViewErrorPreviously).length) {
            inputElementState[Modals.VIEWERROR] = true;
        } else {
            inputElementState[Modals.VIEWERROR] = false;
        }
        // when there is other state and value is not empty
        const StateExistAndValueNotEmpty = value && value.length;

        if (StateExistAndValueNotEmpty) {
            inputElementState[actionId] = value;
        } else {
            // when there is other state and value is empty
            delete inputElementState[actionId];
        }

        await modalInteraction.storeInputElementState(
            DatabaseModal.PROPERTY_NAME,
            inputElementState
        );

        return inputElementState;
    }

    private async handleViewCommentAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { user, value } = this.context.getInteractionData();

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return this.context.getInteractionResponder().errorResponse();
        }

        if (value) {
            return this.handleUpdateOfCommentContextualBar(
                user,
                room,
                tokenInfo,
                modalInteraction,
                value,
                true
            );
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleCommentOnPage(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { user, container, triggerId, value } =
            this.context.getInteractionData();

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return this.context.getInteractionResponder().errorResponse();
        }

        const commentText = await modalInteraction.getInputElementState(
            CommentPage.COMMENT_INPUT_ACTION
        );

        const missingObject = await this.getMissingPropertiesForCommentBar(
            commentText,
            value
        );

        if (Object.keys(missingObject).length) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: container.id,
                errors: missingObject,
            });
        }

        const pageId = value as string;
        const comment: string = commentText?.[NotionObjectTypes.COMMENT];
        const { NotionSdk } = this.app.getUtils();

        const addComment = await NotionSdk.createCommentOnPage(
            tokenInfo,
            pageId,
            comment
        );

        if (addComment instanceof Error) {
            this.app.getLogger().error(addComment);
            return this.context.getInteractionResponder().errorResponse();
        }

        await modalInteraction.clearInputElementState(
            CommentPage.COMMENT_INPUT_ACTION
        );

        const comments = [addComment];
        const commentsInfo = await modalInteraction.getInputElementState(
            CommentPage.REFRESH_OPTION_VALUE
        );

        if (commentsInfo) {
            const oldComments = commentsInfo?.[Modals.DATA] as ICommentInfo[];
            comments.push(...oldComments);
        }

        await modalInteraction.storeInputElementState(
            CommentPage.REFRESH_OPTION_VALUE,
            {
                data: comments,
            }
        );

        return this.handleUpdateOfCommentContextualBar(
            user,
            room,
            tokenInfo,
            modalInteraction,
            pageId
        );
    }

    private async handleCommentInputAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { value, container } = this.context.getInteractionData();

        if (value) {
            await modalInteraction.storeInputElementState(
                CommentPage.COMMENT_INPUT_ACTION,
                {
                    comment: value,
                }
            );
        } else {
            await modalInteraction.clearInputElementState(
                CommentPage.COMMENT_INPUT_ACTION
            );
        }

        return this.context.getInteractionResponder().viewErrorResponse({
            viewId: container.id,
            errors: {},
        });
    }

    private async getMissingPropertiesForCommentBar(
        commentText?: object,
        page?: string
    ) {
        const missingObject = {};

        if (!page) {
            missingObject[SearchPage.SEARCH_COMMENT_ACTION_ID] =
                "Select Notion Page to Comment";
        }
        if (!commentText) {
            missingObject[CommentPage.COMMENT_INPUT_ACTION] =
                "Comment is required";
        }

        return missingObject;
    }

    private async handleRefreshCommentAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { user, container, triggerId, value } =
            this.context.getInteractionData();

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return this.context.getInteractionResponder().errorResponse();
        }

        const pageId = value as string;

        return this.handleUpdateOfCommentContextualBar(
            user,
            room,
            tokenInfo,
            modalInteraction,
            pageId,
            true
        );
    }

    private async handleUpdateOfCommentContextualBar(
        user: IUser,
        room: IRoom,
        tokenInfo: ITokenInfo,
        modalInteraction: ModalInteractionStorage,
        pageId: string,
        refresh?: boolean
    ): Promise<IUIKitResponse> {
        const contextualBar = await createCommentContextualBar(
            this.app,
            user,
            this.read,
            this.persistence,
            this.modify,
            room,
            tokenInfo,
            modalInteraction,
            pageId,
            refresh
        );

        if (contextualBar instanceof Error) {
            // Something went Wrong Propably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(contextualBar.message);
            return this.context.getInteractionResponder().errorResponse();
        }

        return this.context
            .getInteractionResponder()
            .updateContextualBarViewResponse(contextualBar);
    }

    private async handleOverFlowMenuAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { value, user, triggerId } = this.context.getInteractionData();

        if (!value) {
            return this.context.getInteractionResponder().errorResponse();
        }

        // Check if the value is pageId. if not then it is not a refresh comment action
        const OverFlowActions = [
            DatabaseModal.OVERFLOW_MENU_ACTION.toString(),
            NotionPageOrRecord.CHANGE_DATABASE_ACTION.toString(),
        ];

        if (!OverFlowActions.includes(value)) {
            return this.handleRefreshCommentAction(
                modalInteraction,
                oAuth2Storage,
                roomInteractionStorage
            );
        }

        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        const handler = new Handler({
            app: this.app,
            read: this.read,
            modify: this.modify,
            persis: this.persistence,
            http: this.http,
            sender: user,
            room,
            triggerId,
        });

        switch (value) {
            case DatabaseModal.OVERFLOW_MENU_ACTION: {
                await handler.createNotionDatabase();
                break;
            }
            case NotionPageOrRecord.CHANGE_DATABASE_ACTION: {
                await handler.createNotionPageOrRecord(true);
                break;
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleSearchPageAndDatabaseAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { value, user } = this.context.getInteractionData();

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );

            return this.context.getInteractionResponder().errorResponse();
        }

        if (!value) {
            return this.context.getInteractionResponder().errorResponse();
        }

        let Object: IPage | IDatabase = JSON.parse(value);
        let parentObject: IParentPage | IParentDatabase = Object.parent;

        // update the modal if database is selected
        if (parentObject.type.includes(NotionObjectTypes.PAGE_ID)) {
            return this.context.getInteractionResponder().successResponse();
        }

        const database = Object as IDatabase;
        const modal = await createPageOrRecordModal(
            this.app,
            user,
            this.read,
            this.persistence,
            this.modify,
            room,
            modalInteraction,
            tokenInfo,
            database
        );

        if (modal instanceof Error) {
            this.app.getLogger().error(modal.message);
            return this.context.getInteractionResponder().errorResponse();
        }

        return this.context
            .getInteractionResponder()
            .updateModalViewResponse(modal);
    }

    private async handleChangeWorkspaceAction(
        modalInteraction: ModalInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        roomInteractionStorage: RoomInteractionStorage
    ): Promise<IUIKitResponse> {
        const { value, user, triggerId } = this.context.getInteractionData();

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                user,
                this.read,
                this.modify,
                room
            );
            return this.context.getInteractionResponder().errorResponse();
        }

        if (!value) {
            return this.context.getInteractionResponder().errorResponse();
        }

        const changedTokenInfo: ITokenInfo = JSON.parse(value);

        const modal = await changeWorkspaceModal(
            this.app,
            user,
            this.read,
            this.persistence,
            this.modify,
            room,
            modalInteraction,
            changedTokenInfo
        );

        return this.context
            .getInteractionResponder()
            .updateModalViewResponse(modal);
    }
}
