import { NotionObjectTypes } from "../../enum/Notion";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { Modals } from "../../enum/modals/common/Modals";
import {
    MissingPropertyMessage,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";

export function handleMissingProperties(
    state?: object,
    records?: Array<object>
): object {
    const missingObject: object = {
        [NotionObjectTypes.TYPE]: Modals.MISSING,
        [Modals.MISSING]: {},
    };
    const missingInteractionMessage: object = missingObject?.[Modals.MISSING];

    const pageId: string | undefined =
        state?.[SearchPage.BLOCK_ID]?.[SearchPage.ACTION_ID];

    if (!pageId) {
        missingInteractionMessage[SearchPage.ACTION_ID] =
            MissingPropertyMessage.SELECT_PAGE;
    }

    const titlePropertyName: string | undefined =
        state?.[DatabaseModal.TITLE_PROPERTY_BLOCK]?.[
            DatabaseModal.TITLE_PROPERTY_ACTION
        ];

    if (!titlePropertyName) {
        missingInteractionMessage[DatabaseModal.TITLE_PROPERTY_ACTION] =
            MissingPropertyMessage.TITLE_PROPERTY_NAME;
    }

    if (records) {
        records.forEach((record) => {
            const PropertyTypeActionId: string =
                record?.[DatabaseModal.PROPERTY_TYPE];
            const PropertyNameActionId: string =
                record?.[DatabaseModal.PROPERTY_NAME];

            const PropertyType: string | undefined =
                state?.[DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK]?.[
                    PropertyTypeActionId
                ];
            const PropertyName: string | undefined =
                state?.[DatabaseModal.PROPERTY_NAME_BLOCK]?.[
                    PropertyNameActionId
                ];

            if (!PropertyType) {
                missingInteractionMessage[PropertyTypeActionId] =
                    MissingPropertyMessage.PROPERTY_TYPE;
            } else {
                const config: object | undefined =
                    record?.[Modals.ADDITIONAL_CONFIG];
                if (config) {
                    switch (PropertyType) {
                        case PropertyTypeValue.FORMULA: {
                            const expressionActionId: string =
                                config?.[Modals.INPUTFIELD];
                            const expression: string | undefined =
                                state?.[
                                    DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK
                                ]?.[expressionActionId];
                            if (!expression) {
                                missingInteractionMessage[expressionActionId] =
                                    MissingPropertyMessage.EXPRESSION;
                            }
                            break;
                        }
                        case PropertyTypeValue.MULTI_SELECT:
                        case PropertyTypeValue.SELECT: {
                            const options: Array<{
                                [Modals.INPUTFIELD]: string;
                                [Modals.DROPDOWN]: string;
                            }> = config?.[Modals.OPTIONS];

                            options.forEach((option) => {
                                const actionIdInputField: string =
                                    option?.[Modals.INPUTFIELD];
                                const optionName: string | undefined =
                                    state?.[
                                        DatabaseModal.PROPERTY_TYPE_SELECT_BLOCK
                                    ]?.[actionIdInputField];

                                if (!optionName) {
                                    missingInteractionMessage[
                                        actionIdInputField
                                    ] = MissingPropertyMessage.OPTION_NAME;
                                }
                            });

                            break;
                        }
                    }
                }
            }

            if (!PropertyName) {
                missingInteractionMessage[PropertyNameActionId] =
                    MissingPropertyMessage.PROPERTY_NAME;
            }
        });
    }

    return missingObject;
}
