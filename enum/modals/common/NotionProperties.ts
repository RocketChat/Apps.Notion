export enum PropertyTypeValue {
    TEXT = "rich_text",
    NUMBER = "number",
    SELECT = "select",
    MULTI_SELECT = "multi_select",
    DATE = "date",
    PEOPLE = "people",
    FILES = "files",
    CHECKBOX = "checkbox",
    URL = "url",
    EMAIL = "email",
    PHONE_NUMBER = "phone_number",
    FORMULA = "formula",
    CREATED_TIME = "created_time",
    CREATED_BY = "created_by",
    LAST_EDITED_TIME = "last_edited_time",
    LAST_EDITED_BY = "last_edited_by",
}

export enum PropertyType {
    TEXT = "Text",
    NUMBER = "Number",
    SELECT = "Select",
    MULTI_SELECT = "Multi Select",
    DATE = "Date",
    PEOPLE = "People",
    FILES = "Files",
    CHECKBOX = "Checkbox",
    URL = "URL",
    EMAIL = "Email",
    PHONE_NUMBER = "Phone",
    FORMULA = "Formula",
    CREATED_TIME = "Created time",
    CREATED_BY = "Created by",
    LAST_EDITED_TIME = "Last edited time",
    LAST_EDITED_BY = "Last edited by",
}

export enum Number {
    NUMBER = "number",
    NUMBER_WITH_COMMAS = "number_with_commas",
    PERCENT = "percent",
    DOLLAR = "dollar",
    CANADIAN_DOLLAR = "canadian_dollar",
    EURO = "euro",
    POUND = "pound",
    YEN = "yen",
    RUBLE = "ruble",
    RUPEE = "rupee",
    WON = "won",
    YUAN = "yuan",
    REAL = "real",
    LIRA = "lira",
    RUPIAH = "rupiah",
    FRANC = "franc",
    HONG_KONG_DOLLAR = "hong_kong_dollar",
    NEW_ZEALAND_DOLLAR = "new_zealand_dollar",
    KRONA = "krona",
    NORWEGIAN_KRONE = "norwegian_krone",
    MEXICAN_PESO = "mexican_peso",
    RAND = "rand",
    NEW_TAIWAN_DOLLAR = "new_taiwan_dollar",
    DANISH_KRONE = "danish_krone",
    ZLOTY = "zloty",
    BAHT = "baht",
    FORINT = "forint",
    KORUNA = "koruna",
    SHEKEL = "shekel",
    CHILEAN_PESO = "chilean_peso",
    PHILIPPINE_PESO = "philippine_peso",
    DIRHAM = "dirham",
    COLOMBIAN_PESO = "colombian_peso",
    RIYAL = "riyal",
    RINGGIT = "ringgit",
    LEU = "leu",
    ARGENTINE_PESO = "argentine_peso",
    URUGUAYAN_PESO = "uruguayan_peso",
    SINGAPORE_DOLLAR = "singapore_dollar",
    AUSTRALIAN_DOLLAR = "australian_dollar",
}

export enum Color {
    DEFAULT = "default",
    GRAY = "gray",
    BROWN = "brown",
    ORANGE = "orange",
    YELLOW = "yellow",
    GREEN = "green",
    BLUE = "blue",
    PURPLE = "purple",
    PINK = "pink",
    RED = "red",
}

export enum MissingPropertyMessage {
    SELECT_PAGE = "Please Select the Notion Page",
    TITLE_PROPERTY_NAME = "Please Provide Title Property Name",
    PROPERTY_NAME = "Property Name is required",
    PROPERTY_TYPE = "Property Type is required",
    EXPRESSION = "Expression is required",
    OPTION_NAME = "Option Name is required",
}

export type RecordPropertyType = Exclude<
    PropertyTypeValue,
    | PropertyTypeValue.CREATED_TIME
    | PropertyTypeValue.CREATED_BY
    | PropertyTypeValue.LAST_EDITED_TIME
    | PropertyTypeValue.LAST_EDITED_BY
>;

export enum NotSupportedPropertyType {
    RELATION = "relation",
    ROLLUP = "rollup",
}

export const NotSupportedPropertyTypes = [
    PropertyTypeValue.CREATED_TIME.toString(),
    PropertyTypeValue.CREATED_BY.toString(),
    PropertyTypeValue.LAST_EDITED_TIME.toString(),
    PropertyTypeValue.LAST_EDITED_BY.toString(),
    NotSupportedPropertyType.RELATION.toString(),
    NotSupportedPropertyType.ROLLUP.toString(),
    PropertyTypeValue.FILES.toString(),
];

export enum CheckboxEnum {
    TRUE = "true",
    FALSE = "false",
    YES = "Yes",
    NO = "No",
}
