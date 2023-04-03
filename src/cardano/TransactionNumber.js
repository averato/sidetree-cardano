"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransactionNumber {
    static construct(blockNumber, position) {
        const transactionNumber = blockNumber * (2 ** this.bitWidth) +
            position;
        return transactionNumber;
    }
    static lastTransactionOfBlock(blockHeight) {
        return TransactionNumber.construct(blockHeight + 1, 0) - 1;
    }
    static getBlockNumber(transactionNumber) {
        const blockNumber = Math.floor(transactionNumber / (2 ** this.bitWidth));
        return blockNumber;
    }
    static getPosition(transactionNumber) {
        const mask = 2 ** TransactionNumber.bitWidth - 1;
        return (transactionNumber & mask);
    }
}
exports.default = TransactionNumber;
TransactionNumber.bitWidth = 32;
//# sourceMappingURL=TransactionNumber.js.map