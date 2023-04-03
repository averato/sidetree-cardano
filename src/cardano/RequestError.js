"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Response_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/Response"));
class RequestError extends Error {
    get status() {
        return Response_1.default.toHttpStatus(this.responseCode);
    }
    get expose() {
        return this.code !== undefined;
    }
    constructor(responseCode, code) {
        super(code ? JSON.stringify({ code }) : undefined);
        this.responseCode = responseCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.default = RequestError;
//# sourceMappingURL=RequestError.js.map