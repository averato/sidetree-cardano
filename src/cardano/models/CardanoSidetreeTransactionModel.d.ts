export default interface CardanoSidetreeTransactionModel {
    txHash: string;
    fees: number;
    txCBOR: string;
    txBytes: Uint8Array;
}
