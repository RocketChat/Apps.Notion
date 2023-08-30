import { NotionObjectTypes } from "../../enum/Notion";
import { NotSupportedPropertyTypes } from "../../enum/modals/common/NotionProperties";

export function getPropertiesIdsObject(properties: object): {
    [key: string]: boolean;
} {
    let result = {};

    for (const [property] of Object.entries(properties)) {
        const propertyObject: object = properties[property];
        const propertyType: string = propertyObject?.[NotionObjectTypes.TYPE];
        const propertyId: string = propertyObject?.[NotionObjectTypes.ID];

        if (!propertyType.includes(NotionObjectTypes.TITLE.toString())) {
            if (!NotSupportedPropertyTypes.includes(propertyType)) {
                result[propertyId] = false;
            }
        }
    }
    return result;
}
