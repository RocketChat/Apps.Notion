import { IMessageAttachmentField } from "@rocket.chat/apps-engine/definition/messages";
import { NotionObjectTypes } from "../../enum/Notion";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { Modals } from "../../enum/modals/common/Modals";
import { PropertyTypeValue } from "../../enum/modals/common/NotionProperties";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";

export function getNotionDatabaseObject(
    state?: object,
    records?: Array<object>
) {
    const pageId: string = state?.[SearchPage.BLOCK_ID]?.[SearchPage.ACTION_ID];
    const titleOfDatabase: string | undefined =
        state?.[DatabaseModal.TITLE_BLOCK]?.[DatabaseModal.TITLE_ACTION];

    const properties = {};
    const titlePropertyName: string =
        state?.[DatabaseModal.TITLE_PROPERTY_BLOCK]?.[
            DatabaseModal.TITLE_PROPERTY_ACTION
        ];
    properties[titlePropertyName] = {
        title: {},
    };

    // table attachments
    const tableAttachments: Array<IMessageAttachmentField> = [
        {
            short: true,
            title: DatabaseModal.PROPERTY_NAME,
            value: titlePropertyName,
        },
        {
            short: true,
            title: DatabaseModal.PROPERTY_TYPE,
            value: DatabaseModal.PROPERTY_TYPE_TITLE,
        },
    ];

    if (records) {
        records.forEach((record) => {
            const PropertyTypeActionId: string =
                record?.[DatabaseModal.PROPERTY_TYPE];
            const PropertyNameActionId: string =
                record?.[DatabaseModal.PROPERTY_NAME];

            const PropertyType: string =
                state?.[DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK]?.[
                    PropertyTypeActionId
                ];
            const PropertyName: string =
                state?.[DatabaseModal.PROPERTY_NAME_BLOCK]?.[
                    PropertyNameActionId
                ];

            // table attachments
            const tableAttachment: Array<IMessageAttachmentField> = [
                {
                    short: true,
                    title: "",
                    value: PropertyName,
                },
                {
                    short: true,
                    title: "",
                    value: PropertyType,
                },
            ];

            tableAttachments.push(...tableAttachment);

            const config: object | undefined =
                record?.[Modals.ADDITIONAL_CONFIG];
            if (config) {
                switch (PropertyType) {
                    case PropertyTypeValue.NUMBER: {
                        const numberFormatActionId: string =
                            config?.[Modals.DROPDOWN];
                        const numberFormat: string =
                            state?.[DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK]?.[
                                numberFormatActionId
                            ];

                        properties[PropertyName] = {
                            [PropertyType]: {
                                [NotionObjectTypes.FORMAT]: numberFormat,
                            },
                        };

                        break;
                    }
                    case PropertyTypeValue.FORMULA: {
                        const expressionActionId: string =
                            config?.[Modals.INPUTFIELD];
                        const expression: string =
                            state?.[DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK]?.[
                                expressionActionId
                            ];

                        properties[PropertyName] = {
                            [PropertyType]: {
                                [NotionObjectTypes.EXPRESSION]: expression,
                            },
                        };

                        break;
                    }
                    case PropertyTypeValue.MULTI_SELECT:
                    case PropertyTypeValue.SELECT: {
                        const options: Array<{ name: string; color: string }> =
                            [];
                        const optionsActionIds: Array<{
                            [Modals.INPUTFIELD]: string;
                            [Modals.DROPDOWN]: string;
                        }> = config?.[Modals.OPTIONS];

                        optionsActionIds.forEach((option) => {
                            const actionIdInputField: string =
                                option?.[Modals.INPUTFIELD];
                            const optionName: string =
                                state?.[
                                    DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK
                                ]?.[actionIdInputField];

                            const actionIdDropdown: string =
                                option?.[Modals.DROPDOWN];
                            const optionColor: string =
                                state?.[
                                    DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK
                                ]?.[actionIdDropdown];
                            options.push({
                                name: optionName,
                                color: optionColor,
                            });
                        });

                        properties[PropertyName] = {
                            [PropertyType]: {
                                [Modals.OPTIONS]: options,
                            },
                        };
                        break;
                    }
                }
            } else {
                properties[PropertyName] = {
                    [PropertyType]: {},
                };
            }
        });
    }

    const data = {
        parent: {
            type: NotionObjectTypes.PAGE_ID,
            [NotionObjectTypes.PAGE_ID]: pageId,
        },
        ...(!titleOfDatabase
            ? undefined
            : {
                  title: [
                      {
                          type: NotionObjectTypes.TEXT,
                          [NotionObjectTypes.TEXT]: {
                              content: titleOfDatabase,
                              link: null,
                          },
                      },
                  ],
              }),
        properties,
    };

    return {
        data,
        tableAttachments,
    };
}
