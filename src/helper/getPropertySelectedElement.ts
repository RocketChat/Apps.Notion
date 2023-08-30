import { Block } from "@rocket.chat/ui-kit";
import { NotionObjectTypes } from "../../enum/Notion";
import { inputElementComponent } from "../modals/common/inputElementComponent";
import { NotionApp } from "../../NotionApp";
import {
    CheckboxEnum,
    PropertyTypeValue,
} from "../../enum/modals/common/NotionProperties";
import { DropDownComponent } from "../modals/common/DropDownComponent";
import { StaticSelectOptionsParam } from "../../definition/ui-kit/Element/IStaticSelectElement";
import { DatePickerComponent } from "../modals/common/DatePickerComponent";
import { Modals } from "../../enum/modals/common/Modals";
import { MultiSelectComponent } from "../modals/common/MultiSelectComponent";
import { ModalInteractionStorage } from "../storage/ModalInteraction";
import { INotionUser } from "../../definition/authorization/IOAuth2Storage";
import { NotionPageOrRecord } from "../../enum/modals/NotionPageOrRecord";
export function getPropertySelectedElement(
    app: NotionApp,
    actionId: string,
    item: object,
    modalInteraction: ModalInteractionStorage,
    allUsers?: object
): Block {
    const propertyObject: object = item?.[NotionObjectTypes.OBJECT];
    const propertyType: string = propertyObject?.[NotionObjectTypes.TYPE];
    const propertyName: string = propertyObject?.[NotionObjectTypes.NAME];
    let block: Block;
    switch (propertyType) {
        case PropertyTypeValue.DATE: {
            block = DatePickerComponent(
                {
                    app,
                    label: propertyName,
                },
                {
                    actionId,
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                }
            );
            break;
        }
        case PropertyTypeValue.CHECKBOX: {
            const placeholder: string = `Select ${propertyName}...`;
            const options: StaticSelectOptionsParam = [
                {
                    text: CheckboxEnum.YES,
                    value: CheckboxEnum.TRUE,
                },
                {
                    text: CheckboxEnum.NO,
                    value: CheckboxEnum.FALSE,
                },
            ];

            block = DropDownComponent(
                {
                    app,
                    placeholder,
                    text: propertyName,
                    options,
                },
                {
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                    actionId,
                }
            );
            break;
        }
        case "status":
        case PropertyTypeValue.SELECT: {
            const optionsObject: object = propertyObject?.[propertyType];
            const selectOptions: Array<{
                id: string;
                name: string;
                color: string;
            }> = optionsObject?.[Modals.OPTIONS];

            const placeholder: string = `Select ${propertyName}...`;
            const options: StaticSelectOptionsParam = selectOptions.map(
                (option) => {
                    const { name } = option;
                    return {
                        text: name,
                        value: name,
                    };
                }
            );

            block = DropDownComponent(
                { app, options, placeholder, text: propertyName },
                {
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                    actionId,
                }
            );

            break;
        }
        case PropertyTypeValue.MULTI_SELECT: {
            const optionsObject: object = propertyObject?.[propertyType];
            const selectOptions: Array<{
                id: string;
                name: string;
                color: string;
            }> = optionsObject?.[Modals.OPTIONS];

            const placeholder: string = `Select ${propertyName}...`;
            const options: StaticSelectOptionsParam = selectOptions.map(
                (option) => {
                    const { name } = option;
                    return {
                        text: name,
                        value: name,
                    };
                }
            );

            block = MultiSelectComponent(
                {
                    app,
                    placeholder,
                    label: propertyName,
                    options,
                },
                {
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                    actionId,
                }
            );

            break;
        }
        case PropertyTypeValue.PEOPLE: {
            const persons = allUsers as object;
            const people: Array<INotionUser> =
                allUsers?.[PropertyTypeValue.PEOPLE];
            const options: StaticSelectOptionsParam = people.map((user) => {
                const { object, id, name } = user;
                return {
                    text: name as string,
                    value: JSON.stringify({
                        object,
                        id,
                    }),
                };
            });
            const placeholder = `Select ${propertyName}...`;

            block = MultiSelectComponent(
                {
                    app,
                    options,
                    placeholder,
                    label: propertyName,
                },
                {
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                    actionId,
                }
            );

            break;
        }
        default: {
            const multiline: boolean = propertyType.includes(
                PropertyTypeValue.TEXT
            )
                ? true
                : false;

            const placeholder: string = `Enter ${propertyName}...`;

            block = inputElementComponent(
                {
                    app,
                    placeholder,
                    label: propertyName,
                    multiline,
                },
                {
                    blockId: NotionPageOrRecord.PROPERTY_SELECTED_BLOCK_ELEMENT,
                    actionId,
                }
            );

            break;
        }
    }

    return block;
}
