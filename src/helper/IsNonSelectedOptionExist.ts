export function IsNonSelectedOptionExist(propertiesId: object): boolean {
    for (const [id, value] of Object.entries(propertiesId)) {
        if (!value) {
            return true;
        }
    }

    return false;
}
