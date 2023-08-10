import {
    BlockType,
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
    sendMessage,
    sendMessageWithAttachments,
    sendNotification,
    sendNotificationWithAttachments,
    sendNotificationWithConnectBlock,
} from "../helper/message";
import { RoomInteractionStorage } from "../storage/RoomInteraction";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
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
import { NotionWorkspace } from "../../enum/modals/NotionWorkspace";
import { getConnectPreview } from "../helper/getConnectLayout";
import { getTitleProperty } from "../helper/getTitleProperty";
import { markdownToRichText } from "@tryfabric/martian";
import {
    CheckboxEnum,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { Block } from "@rocket.chat/ui-kit";
import { SharePage } from "../../enum/modals/SharePage";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";
import { ActionButton } from "../../enum/modals/common/ActionButtons";
import { getCredentials } from "../helper/getCredential";
import { ICredential } from "../../definition/authorization/ICredential";

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
            case NotionWorkspace.VIEW_ID: {
                return this.handleSelectOfWorkspace(
                    room,
                    roomInteractionStorage,
                    oAuth2Storage,
                    modalInteraction
                );
                break;
            }
            case SharePage.VIEW_ID: {
                return this.handleSharePage(
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
        const { state, blocks } = view;

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
        const pageSelectState: string | undefined =
            state?.[SearchPageAndDatabase.BLOCK_ID]?.[
                SearchPageAndDatabase.ACTION_ID
            ];

        const missingPropObject = {};

        const title: string | undefined =
            state?.[NotionPageOrRecord.TITLE_BLOCK]?.[
                NotionPageOrRecord.TITLE_ACTION
            ];

        if (!title) {
            if (!pageSelectState) {
                missingPropObject[NotionPageOrRecord.TITLE_ACTION] =
                    "Please Provide a Title";
            } else {
                const titleBlockDatabaseSelected = blocks[2] as Block;
                let titleViewError;

                if (titleBlockDatabaseSelected.type == BlockType.INPUT) {
                    if (
                        titleBlockDatabaseSelected.element.type ===
                        "plain_text_input"
                    ) {
                        titleViewError = titleBlockDatabaseSelected?.[
                            "label"
                        ]?.[NotionObjectTypes.TEXT] as string;
                    } else {
                        const titleBlock = blocks[3] as Block;
                        titleViewError = titleBlock?.["label"]?.[
                            NotionObjectTypes.TEXT
                        ] as string;
                    }
                }

                missingPropObject[
                    NotionPageOrRecord.TITLE_ACTION
                ] = `Please Provide ${titleViewError}`;
            }
        }

        if (!pageSelectState) {
            missingPropObject[SearchPageAndDatabase.ACTION_ID] =
                "Please Select a Page or Database";
        }

        if (Object.keys(missingPropObject).length) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: view.id,
                errors: missingPropObject,
            });
        }

        const Objects: IPage | IDatabase = JSON.parse(
            pageSelectState as string
        );
        const { parent } = Objects;
        const parentType: string = parent.type;

        if (parentType.includes(NotionObjectTypes.PAGE_ID)) {
            return this.handleCreationOfPage(
                tokenInfo,
                room,
                oAuth2Storage,
                modalInteraction,
                Objects as IPage
            );
        }

        return this.handleCreationOfRecord(
            tokenInfo,
            room,
            oAuth2Storage,
            modalInteraction,
            Objects as IDatabase
        );
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
            const { name, link, title, pageId } = createdPage;
            message = `✨ Your Page [**${title}**](${link}) is created successfully  as a subpage in **${name}**.`;

            const preserveMessage = await modalInteraction.getInputElementState(
                ActionButton.SEND_TO_NEW_PAGE_MESSAGE_ACTION
            );

            if (preserveMessage) {
                const preserveMessageContext = preserveMessage as {
                    id: string;
                    text: string;
                    room: IRoom;
                };

                const { id, text } = preserveMessageContext;

                const appendBlock = await NotionSdk.appendMessageBlock(
                    access_token,
                    text,
                    pageId
                );

                if (appendBlock instanceof Error) {
                    this.app.getLogger().error(appendBlock.message);
                    message = `🚫 Something went wrong while appending message in **${workspace_name}**.`;
                    await sendNotification(this.read, this.modify, user, room, {
                        message,
                    });
                } else {
                    const { type, displayName } = preserveMessageContext.room;
                    const urlPath =
                        type === RoomType.CHANNEL
                            ? "channel"
                            : type === RoomType.PRIVATE_GROUP
                            ? "group"
                            : "direct";
                    const { siteUrl } = (await getCredentials(
                        this.read,
                        this.modify,
                        user,
                        room
                    )) as ICredential;

                    const messageLink = `${siteUrl}/${urlPath}/${displayName}?msg=${id}`;
                    const preserveText = `📝 Created New Page [**${title}**](${link}) and Preserved Following [Message](${messageLink}) `;

                    await sendMessage(
                        this.read,
                        this.modify,
                        user,
                        room,
                        { message: preserveText },
                        id
                    );
                }
            }
        }

        await sendNotification(this.read, this.modify, user, room, {
            message,
        });

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleCreationOfRecord(
        tokenInfo: ITokenInfo,
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage,
        database: IDatabase
    ): Promise<IUIKitResponse> {
        const { view, user } = this.context.getInteractionData();
        const { state } = view;
        const { NotionSdk } = this.app.getUtils();
        const { access_token, workspace_name, owner } = tokenInfo;
        const username = owner.user.name;

        const properties = (await modalInteraction.getInputElementState(
            SearchPageAndDatabase.ACTION_ID
        )) as object;

        const propertyElements =
            await modalInteraction.getAllInteractionActionId();

        const data = await this.getPagePropParamObject(
            state,
            properties,
            propertyElements
        );

        const createdRecord = await NotionSdk.createRecord(
            access_token,
            database,
            data
        );

        let message: string;

        if (createdRecord instanceof Error) {
            this.app.getLogger().error(createdRecord.message);
            message = `🚫 Something went wrong while creating record in **${workspace_name}**.`;
            await sendNotification(this.read, this.modify, user, room, {
                message,
            });
        } else {
            const { info } = database;
            const databasename = info.name;
            const databaselink = info.link;
            const title: string =
                state?.[NotionPageOrRecord.TITLE_BLOCK]?.[
                    NotionPageOrRecord.TITLE_ACTION
                ];
            const { fields, url, pageId } = createdRecord;

            message = `✨ Created [**${title}**](${url}) in [**${databasename}**](${databaselink})`;

            const messageId = await sendMessageWithAttachments(
                this.read,
                this.modify,
                user,
                room,
                {
                    message: message,
                    fields,
                }
            );

            const preserveMessage = await modalInteraction.getInputElementState(
                ActionButton.SEND_TO_NEW_PAGE_MESSAGE_ACTION
            );

            if (preserveMessage) {
                const preserveMessageContext = preserveMessage as {
                    id: string;
                    text: string;
                    room: IRoom;
                };
                const { id, text } = preserveMessageContext;
                const appendBlock = await NotionSdk.appendMessageBlock(
                    access_token,
                    text,
                    pageId
                );

                if (appendBlock instanceof Error) {
                    this.app.getLogger().error(appendBlock.message);
                    message = `🚫 Something went wrong while appending message in **${workspace_name}**.`;
                    await sendNotification(this.read, this.modify, user, room, {
                        message,
                    });
                } else {
                    const { type, displayName } = preserveMessageContext.room;
                    const urlPath =
                        type === RoomType.CHANNEL
                            ? "channel"
                            : type === RoomType.PRIVATE_GROUP
                            ? "group"
                            : "direct";

                    const { siteUrl } = (await getCredentials(
                        this.read,
                        this.modify,
                        user,
                        room
                    )) as ICredential;

                    const messageLink = `${siteUrl}/${urlPath}/${displayName}?msg=${id}`;
                    const preserveText = `📝 Created [**${title}**](${url}) Page and Preserved Following [Message](${messageLink}) `;

                    await sendMessage(
                        this.read,
                        this.modify,
                        user,
                        room,
                        { message: preserveText },
                        id
                    );
                }
            }
        }

        return this.context.getInteractionResponder().successResponse();
    }

    private async handleSelectOfWorkspace(
        room: IRoom,
        roomInteractionStorage: RoomInteractionStorage,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { user, triggerId, view } = this.context.getInteractionData();
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

        const { state } = view;

        if (!state) {
            return this.context.getInteractionResponder().errorResponse();
        }

        const workspaceInfo: string =
            state?.[NotionWorkspace.CHANGE_WORKSPACE_BLOCK]?.[
                NotionWorkspace.CHANGE_WORKSPACE_ACTION
            ];

        const selectedWorkspace: ITokenInfo = JSON.parse(workspaceInfo);

        if (selectedWorkspace !== tokenInfo) {
            await oAuth2Storage.connectUserToWorkspace(
                selectedWorkspace,
                user.id
            );

            const connectPreview = getConnectPreview(
                this.app.getID(),
                selectedWorkspace
            );

            await sendNotification(this.read, this.modify, user, room, {
                blocks: [connectPreview],
            });
        }

        await roomInteractionStorage.clearInteractionRoomId();
        return this.context.getInteractionResponder().successResponse();
    }

    private async getPagePropParamObject(
        state: object | undefined,
        properties: object,
        propertyElements: { data: object[] } | undefined
    ): Promise<object> {
        const title: string =
            state?.[NotionPageOrRecord.TITLE_BLOCK]?.[
                NotionPageOrRecord.TITLE_ACTION
            ];

        const { label } = await getTitleProperty(properties);

        const data: object = {
            [label]: {
                [NotionObjectTypes.TITLE]: markdownToRichText(title),
            },
        };

        const propertyValues: object =
            state?.[NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT];

        propertyElements?.data?.forEach((propertyInfo: object) => {
            const propertyObject: object =
                propertyInfo?.[NotionObjectTypes.OBJECT];
            const propertyName: string =
                propertyObject?.[NotionObjectTypes.NAME];
            const propertyType: string =
                propertyObject?.[NotionObjectTypes.TYPE];
            const actionId: string = propertyInfo?.[Modals.VALUE];
            const propertyValue: string | Array<string> | undefined =
                propertyValues?.[actionId];

            switch (propertyType) {
                case PropertyTypeValue.CHECKBOX: {
                    data[propertyName] = {
                        [PropertyTypeValue.CHECKBOX]:
                            propertyValue == CheckboxEnum.TRUE,
                    };
                    break;
                }
                case PropertyTypeValue.TEXT: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.TEXT]: markdownToRichText(
                                propertyValue as string
                            ),
                        };
                    }
                    break;
                }
                case PropertyTypeValue.NUMBER: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.NUMBER]: Number(propertyValue),
                        };
                    }

                    break;
                }
                case PropertyTypeValue.URL: {
                    data[propertyName] = {
                        [PropertyTypeValue.URL]: propertyValue
                            ? propertyValue
                            : null,
                    };
                    break;
                }
                case PropertyTypeValue.EMAIL: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.EMAIL]: propertyValue,
                        };
                    }

                    break;
                }
                case PropertyTypeValue.PHONE_NUMBER: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.PHONE_NUMBER]: propertyValue,
                        };
                    }

                    break;
                }
                case PropertyTypeValue.DATE: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.DATE]: {
                                start: propertyValue,
                            },
                        };
                    }

                    break;
                }
                case PropertyTypeValue.SELECT: {
                    if (propertyValue) {
                        data[propertyName] = {
                            [PropertyTypeValue.SELECT]: {
                                name: propertyValue,
                            },
                        };
                    }

                    break;
                }
                case PropertyTypeValue.PEOPLE: {
                    const people: Array<object> = [];
                    if (propertyValue) {
                        (propertyValue as Array<string>)?.forEach((element) => {
                            people.push(JSON.parse(element));
                        });
                        data[propertyName] = {
                            [PropertyTypeValue.PEOPLE]: people,
                        };
                    }
                    break;
                }
                case PropertyTypeValue.MULTI_SELECT: {
                    if (propertyValue) {
                        const multiSelect: Array<object> = [];
                        (propertyValue as Array<string>)?.forEach((element) => {
                            multiSelect.push({ name: element });
                        });
                        data[propertyName] = {
                            [PropertyTypeValue.MULTI_SELECT]: multiSelect,
                        };
                    }
                    break;
                }
                case "status": {
                    if (propertyValue) {
                        data[propertyName] = {
                            status: {
                                name: propertyValue,
                            },
                        };
                    }

                    break;
                }
            }
        });

        return data;
    }

    public async handleSharePage(
        room: IRoom,
        oAuth2Storage: OAuth2Storage,
        modalInteraction: ModalInteractionStorage
    ): Promise<IUIKitResponse> {
        const { view, user } = this.context.getInteractionData();
        const { state } = view;

        const { NotionSdk } = this.app.getUtils();
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

        const { workspace_name, owner, access_token } = tokenInfo;
        const pageId: string | undefined =
            state?.[SearchPage.BLOCK_ID]?.[SharePage.ACTION_ID];

        if (!pageId) {
            return this.context.getInteractionResponder().viewErrorResponse({
                viewId: view.id,
                errors: {
                    [SharePage.ACTION_ID]: "Please Select a Page to Share",
                },
            });
        }

        const pageInfo = await NotionSdk.retrievePage(access_token, pageId);

        if (pageInfo instanceof Error) {
            return this.context.getInteractionResponder().errorResponse();
        }

        const { name, parent, url } = pageInfo;

        const message = `✨ Sharing [**${name}**](${url}) from **${workspace_name}**`;

        await sendMessage(this.read, this.modify, user, room, {
            message,
        });

        return this.context.getInteractionResponder().successResponse();
    }
}
