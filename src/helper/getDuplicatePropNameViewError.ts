export async function getDuplicatePropertyNameViewErrors(PropertyNameState: object) {
    const errors = {};
    const propertyNameFields = Object.keys(PropertyNameState);

    for (let property = 0; property < propertyNameFields.length - 1; property++) {
        const PropertyNameValue =
            PropertyNameState[propertyNameFields[property]];
        for (
            let find = property + 1;
            find < propertyNameFields.length;
            find++
        ) {
            const value = PropertyNameState[propertyNameFields[find]];

            if (PropertyNameValue === value) {
                errors[
                    propertyNameFields[property]
                ] = `Property ${PropertyNameValue} already exists`;
                errors[
                    propertyNameFields[find]
                ] = `Property ${value} already exists`;
            }
        }
    }

    return errors;
}
