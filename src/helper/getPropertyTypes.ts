import {
    PropertyType,
    PropertyTypeValue,
    Number,
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

export function getNumberPropertyFormat() {
    const numberFormat = Object.keys(Number);
    const options: StaticSelectOptionsParam = numberFormat.map((key) => {
        const value = Number[key] as string;
        const removedUnderscore = new RegExp("_", "g");
        const text =
            value.charAt(0).toUpperCase() +
            value.slice(1).replace(removedUnderscore, " ");
        return {
            text,
            value,
        };
    });

    return options;
}
