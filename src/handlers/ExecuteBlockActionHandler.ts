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
        const { actionId, user, room, container } =
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
            default: {
                // Property Type Select Action
                const dispatchActionPropertyType = actionId.startsWith(
                    DatabaseModal.PROPERTY_TYPE_SELECT_ACTION
                );

                // Property Name Character Entered Action
                const dispatchActionPropertyName =
                    actionId.startsWith(DatabaseModal.PROPERTY_NAME_ACTION) ||
                    actionId.startsWith(DatabaseModal.TITLE_PROPERTY_ACTION);

                const dispatchActionConfig = dispatchActionPropertyType
                    ? DatabaseModal.PROPERTY_TYPE_SELECT_ACTION
                    : dispatchActionPropertyName
                    ? DatabaseModal.PROPERTY_NAME_ACTION
                    : DatabaseModal.SELECT_PROPERTY_OPTION_NAME;

                switch (dispatchActionConfig) {
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
        const { user } = this.context.getInteractionData();
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

        const triggerId = this.context.getInteractionData().triggerId;

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
        const { value, actionId, container } =
            this.context.getInteractionData();

        const errors = {};

        if (!value) {
            return this.context.getInteractionResponder().successResponse();
        }

        const inputElementState = await modalInteraction.getInputElementState(
            DatabaseModal.PROPERTY_NAME
        );

        if (!inputElementState) {
            await modalInteraction.storeInputElementState(
                DatabaseModal.PROPERTY_NAME,
                { [actionId]: value, [Modals.VIEWERROR]: false }
            );
            return this.context.getInteractionResponder().successResponse();
        }

        let { data } = await modalInteraction.getAllInteractionActionId();

        const titlePropertyObject = {
            [DatabaseModal.PROPERTY_NAME]: DatabaseModal.TITLE_PROPERTY_ACTION,
        };

        data.push(titlePropertyObject);

        const actionIds = data.map((action) => {
            return action[DatabaseModal.PROPERTY_NAME] as string;
        });

        inputElementState[actionId] = value;

        let newData = {};

        for (const [key] of Object.entries(inputElementState)) {
            if (actionIds.includes(key)) {
                newData[key] = inputElementState[key];
            }
        }

        const isViewErrorPreviously: boolean =
            inputElementState[Modals.VIEWERROR];

        for (const [key] of Object.entries(newData)) {
            if (key !== actionId && newData[key] === value) {
                errors[key] = `Property ${value} already exists`;
            }
        }

        if (Object.keys(errors).length) {
            newData[Modals.VIEWERROR] = true;
            errors[actionId] = `Property ${value} already exists`;
        } else {
            newData[Modals.VIEWERROR] = false;
        }

        await modalInteraction.storeInputElementState(
            DatabaseModal.PROPERTY_NAME,
            newData
        );

        if (isViewErrorPreviously || newData[Modals.VIEWERROR]) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: container.id,
                errors,
            });
        }

        return this.context.getInteractionResponder().successResponse();
    }
}
