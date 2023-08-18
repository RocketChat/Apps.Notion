# Integrate Notion Via RC App

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/RocketChat/Apps.Notion">
    <img src="https://github.com/RocketChat/Apps.Notion/assets/65061890/3923c50d-015b-4974-9ab8-098208030091" alt="Logo">
  </a>

  <h3 align="center">Integrating Notion with Rocket.Chat</h3>

  <p align="center">
    <a href="https://github.com/RocketChat/Apps.Notion">View Demo</a>
    ·
    <a href="https://github.com/RocketChat/Apps.Notion/issues">Report Bug</a>
    ·
    <a href="https://github.com/RocketChat/Apps.Notion/issues">Request Feature</a>
  </p>
</div>

<div align="center">

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

</div>

## 📜 Getting Started

### Prerequisites

-   You need a Rocket.Chat Server Setup
-   Rocket.Chat.Apps CLI,

*   In case you don't have run:
    ```sh
    npm install -g @rocket.chat/apps-cli
    ```

### ⚙️ Installation

-   Every RocketChat Apps runs on RocketChat Server, thus everytime you wanna test you need to deploy the app with this note. lets start setting up:

1. Clone the repo
    ```sh
    git clone https://github.com/<yourusername>/Apps.Notion
    ```
2. Install NPM packages
    ```sh
    npm ci
    ```
3. Deploy app using:

    ```sh
    rc-apps deploy --url <url> --username <username> --password <password>
    ```

4. Once its deploy, Go to Installed Apps and Settings tab in RC,you would see two input fields:

    ```

     # notion-client-id
     # notion-client-secret
     // Generate above Credentials from Notion By Creating the *Public* Integration.
     // https://developers.notion.com/docs/authorization#how-to-make-an-integration-public

    ```

5. Once Its done save the changes, and now under the Notion Integration Provide the Webhook GET endpoint in Redirect URI field of Notion, GET Webhook Endpoint: you can find on the Current App Info under Detail tab in RC.

<!-- ABOUT THE PROJECT -->

## ✅ About The Project:

```

- Integrate Notion Via RC App prioritizes teamwork by enhancing collaboration for Notion Users. Imagine having the power
of two essential platforms,RocketChat and Notion, united as one, eliminating the need to switch between two platforms.
Teams can Seamlessly connect, effortlessly manage various Notion workspaces, Share documents, and Even View Documents
all within RocketChat.
- The real magic lies in Preserving your Important message inside the Notion Page, Structured within the Notion Database,
ensuring vital discussions, decisions, and insights are never lost again, fostering alignment and inclusivity as everyone
stays on the same page, even if they're not actively chatting. Whether it's brainstorming sessions, meeting notes,
or shared links, find them all in one organized place. Plus, Create Comments on the Notion Page, view the Notion Database,
and interact with relevant information.
- Furthermore, do you have a backlog? need to assign tasks, set priorities, or have updates on project status?
No worries; Update Notion database entries without leaving Rocket.Chat. Welcome to a new era of streamlined collaboration,
Where RocketChat and Notion work together seamlessly to fuel your team's success.

```

### This Project Includes Backward Compatible Approach for Authorization:

-   Following things aren't possible with current apps-engine framework version (when writing this).

1.  Incase of any platform Authorization workflow can alter than the usual. In Case of Notion, it suggests to use Basic HTTP Authentication when requesting for access_token while providing the code [check here](https://developers.notion.com/docs/authorization#step-3-the-integration-sends-the-code-in-a-post-request-to-the-notion-api)
2.  Now incase of usual workflow we provide the clientId and clientSecret in params but Notion and in future we may encounter any other platform which would suggest different ways to provide credentials in Authorization header. In case of Notion they suggested to provide the credentials in form of `Basic CLIENTID:CLIENTSECRET` where the credentials provide should be a base64.
3.  In case of any platform we may need the extra info in persistance storage. In case of Notion we needed a lot of extra fields which includes workspace info, access_level of pages, userInfo including the access_token_info etc. [check here](https://developers.notion.com/docs/authorization#step-4-notion-responds-with-an-access_token-and-some-additional-information)

## :rocket: Usage :

```

  👋 Need some help with /notion?

    • use `/notion connect` to connect your workspace
    • use `/notion disconnect` to disconnect workspace
    • use `/notion comment` to comment on notion page
    • use `/notion create` to create page or entries
    • use `/notion create db` to create database
    • use `/notion share` to share pages
    • use `/notion [workspace | ws]` to change workspace
    • use `/notion view` to view page or entries

```

## ✨ Glimpse :

[Video Demo Day]()

<!-- CONTRIBUTING -->

## 🧑‍💻 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue.
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: adds some amazing feature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

## 📚 Resources

Here are some links to examples and documentation:

-   [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
-   [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
-   [Example Rocket.Chat Apps](https://github.com/graywolf336/RocketChatApps)
-   [DemoApp](https://github.com/RocketChat/Rocket.Chat.Demo.App)
-   [GithubApp](https://github.com/RocketChat/Apps.Github22)
-   Community Forums
    -   [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
    -   [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
    -   [Top View of Both Categories](https://forums.rocket.chat/c/rocket-chat-apps)
-   [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/RocketChat/Apps.Notion?style=for-the-badge
[contributors-url]: https://github.com/RocketChat/Apps.Notion/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/RocketChat/Apps.Notion?style=for-the-badge
[forks-url]: https://github.com/RocketChat/Apps.Notion/network/members
[stars-shield]: https://img.shields.io/github/stars/RocketChat/Apps.Notion?style=for-the-badge
[stars-url]: https://github.com/RocketChat/Apps.Notion/stargazers
[issues-shield]: https://img.shields.io/github/issues/RocketChat/Apps.Notion?style=for-the-badge
[issues-url]: https://github.com/RocketChat/Apps.Notion/issues
[license-shield]: https://img.shields.io/github/license/RocketChat/Apps.Notion?style=for-the-badge
[license-url]: https://github.com/RocketChat/Apps.Notion/blob/master/LICENSE.txt
