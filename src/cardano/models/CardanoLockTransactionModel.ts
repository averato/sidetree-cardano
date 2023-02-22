/**
 * Encapsulates data about a lock transaction yet to be broadcasted.
 */
export default interface CardanoLockTransactionModel {
  redeemScriptAsHex: string;
  serializedTransactionObject: string;
  transactionId: string;
  transactionFee: number;

}
