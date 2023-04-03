import LockTransactionType from './SavedLockType';
export default interface SavedLockModel {
    transactionHash: string;
    rawTransaction: string;
    datum: string;
    redeemScriptAsHex: string;
    desiredLockAmountInAda: number;
    createTimestamp: number;
    type: LockTransactionType;
}
