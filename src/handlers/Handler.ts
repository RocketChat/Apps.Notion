import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IHanderParams, IHandler } from "../../definition/handlers/IHandler";
import { OAuth2Storage } from "../authorization/OAuth2Storage";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { NotionApp } from "../../NotionApp";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { createDatabaseModal } from "../modals/createDatabaseModal";
import { Error } from "../../errors/Error";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { sendNotificationWithConnectBlock } from "../helper/message";
import { CommentPage } from "../../enum/modals/CommentPage";
import { createCommentContextualBar } from "../modals/createCommentContextualBar";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
import { createPageOrRecordModal } from "../modals/createPageOrRecordModal";
import { changeWorkspaceModal } from "../modals/changeWorkspaceModal";
import { NotionWorkspace } from "../../enum/modals/NotionWorkspace";
import { SearchPageAndDatabase } from "../../enum/modals/common/SearchPageAndDatabaseComponent";
import { NotionOwnerType } from "../../enum/Notion";
import { PropertyTypeValue } from "../../enum/modals/common/NotionProperties";
import { INotionUser } from "../../definition/authorization/IOAuth2Storage";
import { sharePageModal } from "../modals/sharePageModal";
import { SharePage } from "../../enum/modals/SharePage";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { ActionButton } from "../../enum/modals/common/ActionButtons";
import { SendMessagePage } from "../../enum/modals/SendMessagePage";
import { sendMessagePageModal } from "../modals/sendMessagePageModal";
import { NotionTable } from "../../enum/modals/NotionTable";
import { viewNotionTableModal } from "../modals/viewNotionTableModal";
import { NotionPage } from "../../enum/modals/NotionPage";
import { viewNotionPageModal } from "../modals/viewNotionPageModal";

export class Handler implements IHandler {
    public app: NotionApp;
    public sender: IUser;
    public room: IRoom;
    public read: IRead;
    public modify: IModify;
    public http: IHttp;
    public persis: IPersistence;
    public oAuth2Storage: OAuth2Storage;
    public roomInteractionStorage: RoomInteractionStorage;
    public triggerId?: string;
    public threadId?: string;

    constructor(params: IHanderParams) {
        this.app = params.app;
        this.sender = params.sender;
        this.room = params.room;
        this.read = params.read;
        this.modify = params.modify;
        this.http = params.http;
        this.persis = params.persis;
        this.triggerId = params.triggerId;
        this.threadId = params.threadId;
        const persistenceRead = params.read.getPersistenceReader();
        this.oAuth2Storage = new OAuth2Storage(params.persis, persistenceRead);
        this.roomInteractionStorage = new RoomInteractionStorage(
            params.persis,
            persistenceRead,
            params.sender.id
        );
    }

    public async createNotionDatabase(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            DatabaseModal.VIEW_ID
        );
        const { workspace_id } = tokenInfo;
        await modalInteraction.clearAllInteractionActionId();
        await modalInteraction.clearPagesOrDatabase(workspace_id);
        await modalInteraction.clearInputElementState(
            DatabaseModal.PROPERTY_NAME
        );
        const modal = await createDatabaseModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );
        if (modal instanceof Error) {
            // Something went Wrong Propably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        if (this.triggerId) {
            await this.modify
                .getUiController()
                .openSurfaceView(
                    modal,
                    { triggerId: this.triggerId },
                    this.sender
                );
        }
    }

    public async commentOnPages(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            CommentPage.VIEW_ID
        );
        const { workspace_id } = tokenInfo;

        await Promise.all([
            this.roomInteractionStorage.storeInteractionRoomId(roomId),
            modalInteraction.clearPagesOrDatabase(workspace_id),
            modalInteraction.clearInputElementState(
                CommentPage.COMMENT_INPUT_ACTION
            ),
            modalInteraction.clearInputElementState(
                CommentPage.REFRESH_OPTION_VALUE
            ),
        ]);

        const contextualBar = await createCommentContextualBar(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            tokenInfo,
            modalInteraction
        );

        if (contextualBar instanceof Error) {
            // Something went Wrong Propably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(contextualBar.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            await this.modify.getUiController().openSurfaceView(
                contextualBar,
                {
                    triggerId,
                },
                this.sender
            );
        }
    }

    public async createNotionPageOrRecord(
        update?: boolean,
        message?: IMessage
    ): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            NotionPageOrRecord.VIEW_ID
        );

        const { workspace_id, access_token } = tokenInfo;

        await Promise.all([
            this.roomInteractionStorage.storeInteractionRoomId(roomId),
            modalInteraction.clearPagesOrDatabase(workspace_id),
            modalInteraction.clearInputElementState(
                SearchPageAndDatabase.ACTION_ID
            ),
            modalInteraction.clearAllInteractionActionId(),
        ]);

        const modal = await createPageOrRecordModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Probably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            if (update) {
                await this.modify.getUiController().updateSurfaceView(
                    modal,
                    {
                        triggerId,
                    },
                    this.sender
                );

                return;
            }

            await modalInteraction.clearInputElementState(
                ActionButton.SEND_TO_NEW_PAGE_MESSAGE_ACTION
            );

            if (message) {
                await modalInteraction.storeInputElementState(
                    ActionButton.SEND_TO_NEW_PAGE_MESSAGE_ACTION,
                    message
                );
            }

            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }

        const { NotionSdk } = this.app.getUtils();
        const users = await NotionSdk.retrieveAllUsers(access_token);

        if (users instanceof Error) {
            this.app.getLogger().error(users.message);
        } else {
            let people: Array<INotionUser> = [];

            users.forEach((person) => {
                if (person.type.includes(NotionOwnerType.PERSON)) {
                    people.push(person as INotionUser);
                }
            });

            await modalInteraction.storeInputElementState(
                PropertyTypeValue.PEOPLE,
                {
                    people,
                }
            );
        }

        return;
    }

    public async changeNotionWorkspace(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            NotionWorkspace.VIEW_ID
        );

        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const modal = await changeWorkspaceModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        const triggerId = this.triggerId;

        if (triggerId) {
            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }
    }

    public async shareNotionPage(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            SharePage.VIEW_ID
        );

        const { workspace_id } = tokenInfo;

        await modalInteraction.clearPagesOrDatabase(workspace_id);
        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const modal = await sharePageModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Probably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }
    }

    public async sendToNotionPage(message: IMessage): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            SendMessagePage.VIEW_ID
        );

        const { workspace_id } = tokenInfo;

        await modalInteraction.clearPagesOrDatabase(workspace_id);
        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const modal = await sendMessagePageModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Probably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            await modalInteraction.storeInputElementState(
                ActionButton.SEND_TO_PAGE_MESSAGE_ACTION,
                message
            );

            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }
    }

    public async viewNotionTable(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }
        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            NotionTable.VIEW_ID
        );

        const { workspace_id } = tokenInfo;
        await modalInteraction.clearPagesOrDatabase(workspace_id);

        const modal = await viewNotionTableModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Probably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }
    }

    public async viewNotionPage(): Promise<void> {
        const userId = this.sender.id;
        const roomId = this.room.id;
        const tokenInfo = await this.oAuth2Storage.getCurrentWorkspace(userId);

        if (!tokenInfo) {
            await sendNotificationWithConnectBlock(
                this.app,
                this.sender,
                this.read,
                this.modify,
                this.room
            );
            return;
        }
        await this.roomInteractionStorage.storeInteractionRoomId(roomId);

        const persistenceRead = this.read.getPersistenceReader();
        const modalInteraction = new ModalInteractionStorage(
            this.persis,
            persistenceRead,
            userId,
            NotionPage.VIEW_ID
        );

        const { workspace_id } = tokenInfo;
        await modalInteraction.clearPagesOrDatabase(workspace_id);

        const modal = await viewNotionPageModal(
            this.app,
            this.sender,
            this.read,
            this.persis,
            this.modify,
            this.room,
            modalInteraction,
            tokenInfo
        );

        if (modal instanceof Error) {
            // Something went Wrong Probably SearchPageComponent Couldn't Fetch the Pages
            this.app.getLogger().error(modal.message);
            return;
        }

        const triggerId = this.triggerId;

        if (triggerId) {
            await this.modify
                .getUiController()
                .openSurfaceView(modal, { triggerId }, this.sender);
        }
    }
}