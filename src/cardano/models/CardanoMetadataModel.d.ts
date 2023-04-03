export default interface CardanoMetadataModel {
    txHash: string;
    jsonMetadata: string | null;
    cborMetadata: string | null;
}
