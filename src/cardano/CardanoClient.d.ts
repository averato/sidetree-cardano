import CardanoClientBF from './CardanoClient_blockfrost';
declare class CardanoClient extends CardanoClientBF {
    getAddress(): Promise<string>;
}
export default CardanoClient;
