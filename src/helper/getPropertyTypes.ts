import {
    PropertyType,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { StaticSelectOptionsParam } from "../../definition/ui-kit/Element/IStaticSelectElement";

export function getPropertyTypes() {
    const propertyKeys = Object.keys(PropertyType);

    const options: StaticSelectOptionsParam = propertyKeys.map((key) => {
        return {
            text: PropertyType[key] as string,
            value: PropertyTypeValue[key] as string,
        };
    });

    return options;
}
