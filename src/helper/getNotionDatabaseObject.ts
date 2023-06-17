import { NotionObjectTypes } from "../../enum/Notion";
import { DatabaseModal } from "../../enum/modals/NotionDatabase";
import { SearchPage } from "../../enum/modals/common/SearchPageComponent";

export function getNotionDatabaseObject(
    state?: object,
    records?: Array<object>
): object {

    // handling of required params will be done in next PR
    // handling property with Configuration which is "Number | formula | MultiSelect | Select" will be done in next PR
    
    const properties = {
        [state?.[DatabaseModal.TITLE_PROPERTY_BLOCK]?.[
            DatabaseModal.TITLE_PROPERTY_ACTION
        ]]: {
            title: {},
        },
    };

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

            properties[PropertyName] = {
                [PropertyType]: {},
            };
        });
    }

    const pageId: string | undefined =
        state?.[SearchPage.BLOCK_ID]?.[SearchPage.ACTION_ID];

    const titleOfDatabase: string | undefined =
        state?.[DatabaseModal.TITLE_BLOCK]?.[DatabaseModal.TITLE_ACTION];

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

    return data;
}
