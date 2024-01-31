export enum Messages {
    HELPER_COMMANDS = `• use \`/notion connect\` to connect your workspace   
        • use \`/notion disconnect\` to disconnect workspace   
        • use \`/notion comment\` to comment on notion page   
        • use \`/notion create\` to create page or record   
        • use \`/notion create db\` to create database   
        • use \`/notion workspace\` to change workspace   
        • use \`/notion share\` to share pages

        `,
    HELPER_TEXT = `:wave: Need some help with \`/notion\`?`,
}

export enum OnInstallContent {
    PREVIEW_TITLE = "[**📖 Notion App**](https://github.com/RocketChat/Apps.Notion/)",
    PREVIEW_DESCRIPTION = "**🙌 Installed and Rollin' on your Server!**",
    PREVIEW_CONTEXT = "[**🤝 Support's Page**](https://github.com/RocketChat/Apps.Notion/issues)",
    PREVIEW_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg",
    WELCOMING_MESSAGE = `
        🔧 Setting up the Notion App is a breeze! Create a [**Notion Public Integration**](https://developers.notion.com/docs/authorization#how-to-make-an-integration-public) and Just head over to the App Settings, Provide your credentials.
        🎉 You're all set to experience the seamless integration of Notion and RocketChat.
        ✨ Need some help getting started? Just type \`/notion help\` to access our comprehensive command list.
        💌 We love hearing from you! If you have any suggestions, questions, or just want to share your thoughts, simply tap on the **Support's Page** in Preview.
        🌟 Let's streamline your productivity and collaboration together. Enjoy the journey! 

        Thanks for choosing \`Notion App\`
    `,
    WELCOME_TEXT = `Welcome to **Notion App** in RocketChat!`,
}
