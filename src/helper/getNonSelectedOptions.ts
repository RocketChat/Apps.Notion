import { IDatabase } from "../../definition/lib/INotion";
import { StaticSelectOptionsParam } from "../../definition/ui-kit/Element/IStaticSelectElement";
import { NotionObjectTypes } from "../../enum/Notion";
import {
    NotSupportedPropertyTypes,
    PropertyType,
} from "../../enum/modals/common/NotionProperties";

export function getNonSelectedOptions(
    properties: object,
    data: object,
    parent: IDatabase,
    propertiesId: object
): StaticSelectOptionsParam {
    const result: StaticSelectOptionsParam = [];
    const NonSupportedOptionType = [
        NotionObjectTypes.TITLE.toString(),
        ...NotSupportedPropertyTypes,
    ];

    const selectedOption: object | undefined = data?.[NotionObjectTypes.OBJECT];

    if (selectedOption) {
        const selectedOptionName: string =
            selectedOption?.[NotionObjectTypes.NAME];

        result.push({
            text: selectedOptionName,
            value: JSON.stringify({
                parent,
                propertyObject: selectedOption,
            }),
        });
    }

    for (const [property] of Object.entries(properties)) {
        const propertyObject: object = properties[property];
        const propertyId: string = propertyObject?.[NotionObjectTypes.ID];
        const propertyType: string = propertyObject?.[NotionObjectTypes.TYPE];

        if (
            !NonSupportedOptionType.includes(propertyType) &&
            !propertiesId[propertyId]
        ) {
            const propertyName: string =
                propertyObject?.[NotionObjectTypes.NAME];
            result.push({
                text: propertyName,
                value: JSON.stringify({
                    parent,
                    propertyObject,
                }),
            });
        }
    }

    return result;
}
