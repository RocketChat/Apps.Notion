import { IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export async function getOrCreateDirectRoom(
    read: IRead,
    modify: IModify,
    usernames: Array<string>
): Promise<IRoom> {
    // try to get the room first with usernames
    // case where we may not a room already
    // admin may have deleted the room
    let room: IRoom | undefined = await read
        .getRoomReader()
        .getDirectByUsernames(usernames);

    // nice, room exist already, lets return it.
    if (room) {
        return room;
    }

    // no room for the given users. Lets create a room now!
    // use app user bot as creator
    const creator = (await read.getUserReader().getAppUser()) as IUser;

    // Create direct room
    const newRoom = modify
        .getCreator()
        .startRoom()
        .setType(RoomType.DIRECT_MESSAGE)
        .setCreator(creator)
        .setMembersToBeAddedByUsernames(usernames);

    const roomId = await modify.getCreator().finish(newRoom);
    return (await read.getRoomReader().getById(roomId)) as IRoom;
}
