import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoBlockModel from './models/CardanoBlockModel.ts';
import CardanoInputModel from './models/CardanoInputModel.ts';
import CardanoMetadataModel from './models/CardanoMetadataModel.ts';
import CardanoOutputModel from './models/CardanoOutputModel.ts';
import CardanoProtocolParameters from './models/CardanoProtocolParameters.ts';
import CardanoSidetreeTransactionModel from './models/CardanoSidetreeTransactionModel.ts';
import CardanoTransactionModel from './models/CardanoTransactionModel.ts';
import CardanoWallet from './CardanoWallet.ts';
import ICardanoWallet from './interfaces/ICardanoWallet.ts';
import Logger from 'sidetree/common/Logger.ts';
import TransactionNumber from './TransactionNumber.ts';
import { Buffer } from 'node:buffer';

/**
 * Encapsulates functionality for reading/writing to the Cardano ledger
 * This implementation use Blockfrost to query the blockchain and submit transactions
 * This class can easily be adapted to use othe APIs to interact with Cardano
 */
export default class CardanoClientBF {

  protected readonly cardanoWallet: ICardanoWallet;
  private readonly blockfrostAPI: BlockFrostAPI;

  constructor (
    readonly cardanoWalletMnemonic: string,
    readonly blockfrostProjectId: string,
    readonly cardanoNetwork: 'mainnet' | 'testnet' | 'preview',
    readonly cardanoMetadataLabel: string
  ) {

    this.cardanoWallet = new CardanoWallet(cardanoWalletMnemonic, cardanoNetwork);

    this.blockfrostAPI = new BlockFrostAPI({projectId: blockfrostProjectId}); //, network: this.cardanoNetwork });

  }

  /**
   * Initialize this Cardano client.
   */
  public async initialize (): Promise<void> {

    Logger.info(`Wallet Address: ${this.cardanoWallet.getAddress()}`);

  }

//  /**
//   * Access Client Wallett Address 
//   */ 
//  public async getWalletAddress(): Promise<string> {
//    const clientAddress = this.cardanoWallet.getAddress().toString();
//    return clientAddress;
//  } 

  /**
   *  Create and Submit Transaction 
   */ 
//  public async broadcastLockTransaction(lockTransaction: )

  /**
   * Submit the signed transaction to Cardano
   * @param cardanoSidetreeTransaction The transaction object
   * @returns the transaction hash
   */
  public async submitSidetreeTransaction (cardanoSidetreeTransaction: CardanoSidetreeTransactionModel): Promise<string> {
    const txId = await this.blockfrostAPI.txSubmit(cardanoSidetreeTransaction.txCBOR);
    return txId;
  }

  /**
   * Generates a valid transaction and sign it
   * @returns the signed transaction
   */
  public async createSidetreeTransaction (transactionData: string): Promise<CardanoSidetreeTransactionModel> {
    const protoParams = await this.getLatestProtocolParameters();
    const ledgerTip = await this.getLedgerTip();
    const utxos = await this.getUtxos();
    const transaction = this.cardanoWallet.createAndSignTransaction(transactionData
                                                                   , this.cardanoMetadataLabel
                                                                   , protoParams
                                                                   , utxos
                                                                   , ledgerTip.slot);
    return transaction;
  }

  /**
   * Create signed transaction without submiting it directly
   * @param lockAmountInLovelace The amount to lock.
   * @param lockDurationInblock The number of block to lock the amount for; the amount become spendable After this block.
   * @returns the signed transaction 
   */
  public async createLockTransaction(transactionData: string): Promise<CardanoSidetreeTransactionModel> {
    const transaction = await this.createSidetreeTransaction(transactionData);
    return transaction;
  }  

  /**
   * Create signed transaction without submiting it directly
   * @returns the signed transaction 
   */
  public async createReleaseLockTransaction(transactionHash: string): Promise<CardanoTransactionModel> {
    const transaction = await this.getTransaction(transactionHash);
    return transaction;
  }  


  /**
   * Get enough UTXO from address to cover 1 ADA + fees = aprox 1.5 ADAS = 1500000 Lovelaces
   * @returns array of UTXOs
   */
  public async getUtxos (): Promise<CardanoInputModel[]> {
    const address = this.cardanoWallet.getAddress().toString();
    const addressUtxos = await this.blockfrostAPI.addressesUtxos(address);
    const utxos: CardanoInputModel[] = [];
    let totalValue = 0;
    for (const utxo of addressUtxos) {
      utxos.push({
        address: address,
        amount: +utxo.amount[0].quantity,
        txHash: utxo.tx_hash,
        index: utxo.tx_index
      });
      totalValue += +utxo.amount[0].quantity;
      if (totalValue >= 1500000) { break; }
    }
    return utxos;
  }

  /**
   * Gets balance in Lovelaces for this node address
   * @returns the balance of the address in Lovelaces
   */
  public async getBalanceInLovelaces (): Promise<number> {

    const address = await this.blockfrostAPI.addresses(this.cardanoWallet.getAddress().toString());
    Logger.info(address);
    return +address.amount[0].quantity; // TODO check if that is allways valid
  }

  /**
   * Gets the transaction fee paid in lovelaces.
   * @param transactionHash the hash of the target transaction.
   * @returns the transaction fee in Lovelaces.
   */
  public async getTransactionFeeInLovelaces (transactionHash: string): Promise<number> {
    const tx = await this.blockfrostAPI.txs(transactionHash);
    return +tx.fees;
  }

  /**
   * Get the full transaction data from the blockchain
   * @param transactionHash The target transaction id.
   * @returns the full tramsaction
   */
  public async getTransaction (transactionHash: string): Promise<CardanoTransactionModel> {
    const tx = await this.blockfrostAPI.txs(transactionHash);
    const block = await this.blockfrostAPI.blocks(tx.block);
    const metadata = await this.blockfrostAPI.txsMetadata(transactionHash);
    const txUTXO = await this.blockfrostAPI.txsUtxos(transactionHash);
    const inputs: CardanoInputModel[] = [];
    for (const i of txUTXO.inputs) {
      inputs.push({
        address: i.address,
        amount: +i.amount[0].quantity,
        txHash: i.tx_hash,
        index: i.output_index
      });
    }
    const outputs: CardanoOutputModel[] = [];
    for (const o of txUTXO.outputs) {
      outputs.push({
        address: o.address,
        amount: +o.amount[0].quantity
      });
    }
    let txmeta = '';
    try {
      const jmeta = metadata[0].json_metadata.toString();
      txmeta = Buffer.from(jmeta.replace('0x', 'hex')).toString();
    } catch (error) {
      Logger.error(`Current transaction metadata error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);

      txmeta = '';
    }
    return {
      outputs: outputs,
      inputs: inputs,
      hash: tx.hash,
      fees: +tx.fees,
      blockHash: tx.block,
      blockHeight: tx.block_height,
      index: tx.index,
      metadata: txmeta,
      blockConfirmations: block.confirmations,
      transactionNumber: TransactionNumber.construct(tx.block_height, tx.index)
    };
  }

  /**
   * Get transaction metadata array
   * in a batch of batcSize size
   * from Page
   * ordered from newest to oldest
   * filtered by metadata label
   * @param page
   * @param batchSize
   */
  public async getTxMetadataPage (page: number, batchSize: number): Promise<CardanoMetadataModel[]> {
    const txMetadatas: CardanoMetadataModel[] = [];
    try {
      const blockFrostMetadatas = await this.blockfrostAPI.metadataTxsLabel(this.cardanoMetadataLabel, { page: page, order: 'desc', count: batchSize });
      for (const meta of blockFrostMetadatas) {
        txMetadatas.push(
          {
            txHash: meta.tx_hash,
            jsonMetadata: meta.json_metadata,
            cborMetadata: null
          }
        );
      }
      return txMetadatas;
    } catch (error) {
      return txMetadatas;
    }
  }

  /**
   * Get the latest cardano blockchain protocol parameters
   * @returns the protocol parameters
   */
  private async getLatestProtocolParameters (): Promise<CardanoProtocolParameters> {
    const latestEpoch = await this.blockfrostAPI.epochsLatest();
    const protocolParams = await this.blockfrostAPI.epochsParameters(latestEpoch.epoch);
    return {
      epoch: protocolParams.epoch,
      minFeeA: protocolParams.min_fee_a,
      minFeeB: protocolParams.min_fee_b,
      maxTxSize: protocolParams.max_tx_size,
      keyDeposit: +protocolParams.key_deposit,
      poolDeposit: +protocolParams.pool_deposit,
      minUtxo: +protocolParams.min_utxo,
      maxValSize: +protocolParams.max_val_size!
    };
  }

  /**
   * Get the latest block in Cardano
   * @returns the latest block
   */
  public async getLedgerTip (): Promise<CardanoBlockModel> {
    const latestBlock = await this.blockfrostAPI.blocksLatest();
    return {
      time: latestBlock.time,
      height: latestBlock.height!,
      hash: latestBlock.hash,
      slot: latestBlock.slot,
      epoch: latestBlock.epoch,
      size: latestBlock.size,
      confirmations: latestBlock.confirmations
    };
  }

//  private async createFreezeTransaction (
//    unspentCoins: CardanoInputModel[],
//    freezeDurationInBlocks: number,
//    freezeAmountInLovlace: number): Promise<CardanoTransactionModel> {
//    Logger.info(`Creating a freeze transaction for amount: ${freezeAmountInLovlace} satoshis with freeze time in blocks: ${freezeDurationInBlocks}`);
//
//    return [];
//  }

}
