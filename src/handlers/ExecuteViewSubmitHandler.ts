import {
    IUIKitResponse,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { NotionApp } from "../../NotionApp";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { clearAllInteraction } from "../helper/clearInteractions";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import {
    sendNotification,
    sendNotificationWithAttachments,
    sendNotificationWithConnectBlock,
} from "../helper/message";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { getNotionDatabaseObject } from "../helper/getNotionDatabaseObject";
import { Error } from "../../errors/Error";
import { Modals } from "../../enum/modals/common/Modals";
import { handleMissingProperties } from "../helper/handleMissingProperties";
import { getDuplicatePropertyNameViewErrors } from "../helper/getDuplicatePropNameViewError";
import { IMessageAttachmentField } from "@rocket.chat/apps-engine/definition/messages";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
import { NotionObjectTypes } from "../../enum/Notion";
import { ITokenInfo } from "../../definition/authorization/IOAuth2Storage";
import { IDatabase, IPage } from "../../definition/lib/INotion";
import { SearchPageAndDatabase } from "../../enum/modals/common/SearchPageAndDatabaseComponent";

export class ExecuteViewSubmitHandler {
    private context: UIKitViewSubmitInteractionContext;
    constructor(
        protected readonly app: NotionApp,
        protected readonly read: IRead,
        protected readonly http: IHttp,
        protected readonly persistence: IPersistence,
        protected readonly modify: IModify,
        context: UIKitViewSubmitInteractionContext
    ) {
        this.context = context;
    }

    public async handleActions(): Promise<IUIKitResponse> {
        const { view, user } = this.context.getInteractionData();
        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persistence,
            persistenceRead,
            user.id,
            view.id
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
        const roomId = await roomInteractionStorage.getInteractionRoomId();
        const room = (await this.read.getRoomReader().getById(roomId)) as IRoom;

        switch (view.id) {
            case DatabaseModal.VIEW_ID: {
                return this.handleCreationOfDatabase(
                    room,
                    oAuth2Storage,
                    modalInteraction
                );
                break;
            }
            case NotionPageOrRecord.VIEW_ID: {
                return this.handleCreationOfPageOrRecord(
                    room,
                    oAuth2Storage,
                    modalInteraction
                );
                break;
            }
            default: {
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    public async handleCreationOfDatabase(
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { NotionSdk } = this.app.getUtils();
        const { user, view } = this.context.getInteractionData();
        const { state } = view;

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);

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

        const { access_token, workspace_id, workspace_name } = tokenInfo;

        const records: { data: Array<object> } | undefined =
            await modalInteraction.getAllInteractionActionId();

        let allViewErrors = {};
        const PropertyNameState = await modalInteraction.getInputElementState(
            DatabaseModal.PROPERTY_NAME
        );
        if (PropertyNameState) {
            const duplicatePropertyNameErrors =
                await getDuplicatePropertyNameViewErrors(PropertyNameState);
            allViewErrors = {
                ...duplicatePropertyNameErrors,
            };
        }

        const missingObject = handleMissingProperties(state, records?.data);
        const missingProperties = missingObject?.[Modals.MISSING];
        const missingPropertyExist = Object.keys(missingProperties).length;

        if (missingPropertyExist) {
            allViewErrors = {
                ...allViewErrors,
                ...missingProperties,
            };
        }

        if (Object.keys(allViewErrors).length) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: view.id,
                errors: allViewErrors,
            });
        }

        const {
            data,
            tableAttachments,
        }: { data: object; tableAttachments: IMessageAttachmentField[] } =
            getNotionDatabaseObject(state, records?.data);

        const response = await NotionSdk.createNotionDatabase(
            access_token,
            data
        );

        let message: string;

        if (response instanceof Error) {
            this.app.getLogger().error(response);
            message = `🚫 Something went wrong while creating Database in **${workspace_name}**.`;

            await sendNotification(this.read, this.modify, user, room, {
                message: message,
            });
        } else {
            const name: string = response.name;
            const link: string = response.link;
            message = `✨ Your Database [**${name}**](${link}) is created successfully in **${workspace_name}**.`;

            await sendNotificationWithAttachments(
                this.read,
                this.modify,
                user,
                room,
                {
                    message: message,
                    fields: tableAttachments,
                }
            );
        }

        await clearAllInteraction(
            this.persistence,
            this.read,
            user.id,
            view.id
        );
        await modalInteraction.clearPagesOrDatabase(workspace_id);
        await modalInteraction.clearInputElementState(
            DatabaseModal.PROPERTY_NAME
        );

        if (response instanceof Error) {
            return this.context.getInteractionResponder().errorResponse();
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleCreationOfPageOrRecord(
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { user, view } = this.context.getInteractionData();
        const { state } = view;

        const tokenInfo = await oAuth2Storage.getCurrentWorkspace(user.id);

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

        // handle missing properties later

        const Object: IPage | IDatabase = JSON.parse(
            state?.[SearchPageAndDatabase.BLOCK_ID]?.[
                SearchPageAndDatabase.ACTION_ID
            ]
        );

        const { parent } = Object;

        const parentType: string = parent.type;

        if (parentType.includes(NotionObjectTypes.PAGE_ID)) {
            return this.handleCreationOfPage(
                tokenInfo,
                room,
                oAuth2Storage,
                modalInteraction,
                Object as IPage
            );
        }

        return this.handleCreationOfRecord();
    }

    private async handleCreationOfPage(
        tokenInfo: ITokenInfo,
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage,
        page: IPage
    ): Promise<IUIKitResponse> {
        const { NotionSdk } = this.app.getUtils();
        const { view, user } = this.context.getInteractionData();
        const { state } = view;
        const { access_token, workspace_name } = tokenInfo;

        const title: string =
            state?.[NotionPageOrRecord.TITLE_BLOCK]?.[
                NotionPageOrRecord.TITLE_ACTION
            ];

        const createdPage = await NotionSdk.createPage(access_token, page, {
            title,
        });

        let message: string;

        if (createdPage instanceof Error) {
            this.app.getLogger().error(createdPage.message);
            message = `🚫 Something went wrong while creating page in **${workspace_name}**.`;
        } else {
            const { name, link, title } = createdPage;
            message = `✨ Your Page [**${title}**](${link}) is created successfully  as a subpage in **${name}**.`;
        }

        await sendNotification(this.read, this.modify, user, room, {
            message,
        });

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleCreationOfRecord(): Promise<IUIKitResponse> {
        return this.context.getInteractionResponder().successResponse();
    }
}
