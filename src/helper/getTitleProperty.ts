import { NotionObjectTypes } from "../../enum/Notion";

export async function getTitleProperty(
    properties: object
): Promise<{ label: string; placeholder: string }> {
    const columns = Object.keys(properties);
    const firstColumn = columns[0];
    const lastColumn = columns[columns.length - 1];

    // title at first position
    if (properties[firstColumn]?.type == NotionObjectTypes.TITLE) {
        return {
            label: firstColumn,
            placeholder: `Enter ${firstColumn}...`,
        };
    }

    //title at last position
    return {
        label: lastColumn,
        placeholder: `Enter ${lastColumn}...`,
    };
}
