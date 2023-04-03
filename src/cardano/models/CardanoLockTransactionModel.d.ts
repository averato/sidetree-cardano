export default interface CardanoLockTransactionModel {
    redeemScriptAsHex: string;
    serializedTransactionObject: string;
    transactionId: string;
    transactionFee: number;
}
