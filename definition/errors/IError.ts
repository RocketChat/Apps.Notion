export interface IError extends Error {
    statusCode: number;
    additionalInfo?: string;
}
