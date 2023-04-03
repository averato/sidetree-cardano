import ResponseStatus from '@k-solutions/sidetree/dist/lib/common/enums/ResponseStatus';
export default class RequestError extends Error {
    readonly responseCode: ResponseStatus;
    readonly code?: string | undefined;
    get status(): number;
    get expose(): boolean;
    constructor(responseCode: ResponseStatus, code?: string | undefined);
}
