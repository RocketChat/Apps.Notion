import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Block } from "@rocket.chat/ui-kit";

export async function sendNotification(
    read: IRead,
    modify: IModify,
    user: IUser,
    room: IRoom,
    content: { message?: string; blocks?: Array<Block> }
): Promise<void> {
    const appUser = (await read.getUserReader().getAppUser()) as IUser;
    const { message, blocks } = content;
    const messageBuilder = modify
        .getCreator()
        .startMessage()
        .setSender(appUser)
        .setRoom(room)
        .setGroupable(false);

    if (message) {
        messageBuilder.setText(message);
    } else if (blocks) {
        messageBuilder.setBlocks(blocks);
    }
    return read.getNotifier().notifyUser(user, messageBuilder.getMessage());
}
