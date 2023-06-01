/* 
    - This file contains all the errors that can be handle by the application includes: 400, 401, 403, 404, 429, 500
    - The error name is the type of the error
    - The message is the message that will be logged in the console
    - The status is the status code of the error
    - The additionalInfo is the additional information that will be logged in the console
*/
import { IError } from "../definition/errors/IError";
import { HttpStatusCode } from "@rocket.chat/apps-engine/definition/accessors";
import { ErrorName } from "../enum/Error";

class Error implements IError {
    name: string;
    message: string;
    status: number;
    additionalInfo?: string;

    constructor(
        name: string,
        message: string,
        status: number,
        additionalInfo?: string
    ) {
        this.name = name;
        this.message = message;
        this.status = status;
        this.additionalInfo = additionalInfo;
    }
}

export class ClientError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.BAD_REQUEST,
            message,
            HttpStatusCode.BAD_REQUEST,
            additionalInfo
        );
    }
}

export class NotFoundError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.NOT_FOUND,
            message,
            HttpStatusCode.NOT_FOUND,
            additionalInfo
        );
    }
}

export class UnAuthorizedError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.UNAUTHORIZED,
            message,
            HttpStatusCode.UNAUTHORIZED,
            additionalInfo
        );
    }
}

export class ForbiddenError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.FORBIDDEN,
            message,
            HttpStatusCode.FORBIDDEN,
            additionalInfo
        );
    }
}

export class ServerError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.SERVER_ERROR,
            message,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            additionalInfo
        );
    }
}

export class ManyRequestsError extends Error {
    constructor(message: string, additionalInfo?: string) {
        super(
            ErrorName.MANY_REQUESTS,
            message,
            HttpStatusCode.TOO_MANY_REQUESTS,
            additionalInfo
        );
    }
}
