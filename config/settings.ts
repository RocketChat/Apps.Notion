import {
    ISetting,
    SettingType,
} from "@rocket.chat/apps-engine/definition/settings";

// The settings that will be available for the App
enum OAuth2Setting {
    CLIENT_ID = "notion-client-id",
    CLIENT_SECRET = "notion-client-secret",
}

export const settings: Array<ISetting> = [
    {
        id: OAuth2Setting.CLIENT_ID,
        type: SettingType.STRING,
        packageValue: "",
        required: true,
        public: false,
        section: "CredentialSettings",
        i18nLabel: "ClientIdLabel",
        i18nPlaceholder: "ClientIdPlaceholder",
        hidden: false,
        multiline: false,
    },
    {
        id: OAuth2Setting.CLIENT_SECRET,
        type: SettingType.PASSWORD,
        packageValue: "",
        required: true,
        public: false,
        section: "CredentialSettings",
        i18nLabel: "ClientSecretLabel",
        i18nPlaceholder: "ClientSecretPlaceholder",
        hidden: false,
        multiline: false,
    },
];
