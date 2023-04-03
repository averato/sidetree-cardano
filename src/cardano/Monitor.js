"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SidetreeError_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/SidetreeError"));
const ErrorCode_1 = __importDefault(require("./ErrorCode"));
const SavedLockType_1 = __importDefault(require("./models/SavedLockType"));
const Logger_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/Logger"));
var LockStatus;
(function (LockStatus) {
    LockStatus["Confirmed"] = "confirmed";
    LockStatus["None"] = "none";
    LockStatus["Pending"] = "pending";
})(LockStatus || (LockStatus = {}));
class Monitor {
    constructor(cardanoClient) {
        this.cardanoClient = cardanoClient;
    }
    getWalletBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            const walletBalanceInLovelaces = yield this.cardanoClient.getBalanceInLovelaces();
            const walletBalanceInAda = walletBalanceInLovelaces / 100000000;
            return { walletBalanceInAda };
        });
    }
    getCurrentValueTimeLock() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentLockState = yield this.getCurrentLockState();
            if (currentLockState.status === LockStatus.None) {
                return undefined;
            }
            if (currentLockState.status === LockStatus.Pending) {
                throw new SidetreeError_1.default(ErrorCode_1.default.LockMonitorCurrentValueTimeLockInPendingState);
            }
            return currentLockState.activeValueTimeLock;
        });
    }
    getCurrentLockState() {
        return __awaiter(this, void 0, void 0, function* () {
            const lastSavedLock = yield this.cardanoClient.getLedgerTip();
            if (!lastSavedLock) {
                return {
                    activeValueTimeLock: undefined,
                    latestSavedLockInfo: undefined,
                    status: LockStatus.None
                };
            }
            Logger_1.default.info(`Found last saved lock of slot: ${lastSavedLock.slot} with transaction id: ${lastSavedLock.hash}.`);
            const ownerAddress = yield this.cardanoClient.getAddress().toString();
            const currentValueTimeLock = {
                identifier: lastSavedLock.hash,
                amountLocked: 1,
                lockTransactionTime: lastSavedLock.time,
                unlockTransactionTime: lastSavedLock.time + 1000,
                normalizedFee: 1,
                owner: ownerAddress
            };
            const savedLockInfo = {
                transactionHash: lastSavedLock.hash,
                rawTransaction: '',
                datum: '',
                redeemScriptAsHex: '',
                desiredLockAmountInAda: 0,
                createTimestamp: 0,
                type: SavedLockType_1.default.Create
            };
            Logger_1.default.info(`Found a valid current lock: ${JSON.stringify(currentValueTimeLock)}`);
            return {
                activeValueTimeLock: currentValueTimeLock,
                latestSavedLockInfo: savedLockInfo,
                status: LockStatus.Confirmed
            };
        });
    }
}
exports.default = Monitor;
//# sourceMappingURL=Monitor.js.map