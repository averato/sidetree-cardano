export default class TransactionNumber {
    private static readonly bitWidth;
    static construct(blockNumber: number, position: number): number;
    static lastTransactionOfBlock(blockHeight: number): number;
    static getBlockNumber(transactionNumber: number): number;
    static getPosition(transactionNumber: number): number;
}
