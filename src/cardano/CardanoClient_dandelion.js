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
const CardanoWallet_1 = __importDefault(require("./CardanoWallet"));
const Logger_1 = __importDefault(require("@k-solutions/sidetree/dist/lib/common/Logger"));
const TransactionNumber_1 = __importDefault(require("./TransactionNumber"));
const axios_1 = __importDefault(require("axios"));
class CardanoClient {
    constructor(cardanoWalletMnemonic, blockfrostProjectId, cardanoNetwork, cardanoMetadataLabel) {
        this.cardanoWalletMnemonic = cardanoWalletMnemonic;
        this.blockfrostProjectId = blockfrostProjectId;
        this.cardanoNetwork = cardanoNetwork;
        this.cardanoMetadataLabel = cardanoMetadataLabel;
        this.cardanoWallet = new CardanoWallet_1.default(cardanoWalletMnemonic, cardanoNetwork);
        this.submitTxURL = this.cardanoNetwork === 'testnet' ? 'https://submit-api.testnet.dandelion.link/api/submit/tx' : 'https://submit-api.mainnet.dandelion.link/api/submit/tx';
        this.graphQLURL = this.cardanoNetwork === 'testnet' ? 'https://graphql-api.testnet.dandelion.link/api/submit/tx' : 'https://graphql-api.mainnet.dandelion.link/api/submit/tx';
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.default.info(`Wallet Address: ${this.cardanoWallet.getAddress()}`);
        });
    }
    submitSidetreeTransaction(cardanoSidetreeTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const txId = yield axios_1.default.post(this.submitTxURL, cardanoSidetreeTransaction.txBytes, {
                headers: {
                    'Content-Type': 'application/cbor'
                }
            });
            return txId.data;
        });
    }
    createSidetreeTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const protoParams = yield this.getLatestProtocolParameters();
            const ledgerTip = yield this.getLedgerTip();
            const utxos = yield this.getUtxos();
            const transaction = this.cardanoWallet.createAndSignTransaction(transactionData, this.cardanoMetadataLabel, protoParams, utxos, ledgerTip.slot);
            return transaction;
        });
    }
    getUtxos() {
        return __awaiter(this, void 0, void 0, function* () {
            const address = this.cardanoWallet.getAddress().toString();
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query utxoSetForAddress (
            $address: String!
            ){
                utxos(
                    order_by: { value: asc }
                    where: { address: { _eq: $address }}
                ) {
                    address
                    index
                    txHash
                    value
                }
            }`,
                variables: {
                    address: address
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const utxos = [];
            let totalValue = 0;
            for (const utxo of resp.data.data.utxos) {
                utxos.push({
                    address: utxo.address,
                    amount: +utxo.value,
                    txHash: utxo.txHash,
                    index: utxo.index
                });
                totalValue += +utxo.value;
                if (totalValue >= 1500000) {
                    break;
                }
            }
            return utxos;
        });
    }
    getBalanceInLovelaces() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query utxoSetForAddress (
            $address: String!
            ){
                utxos(
                    order_by: { value: asc }
                    where: { address: { _eq: $address }}
                ) {
                    value
                }
            }`,
                variables: {
                    address: this.cardanoWallet.getAddress().toString()
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            let totalValue = 0;
            for (const utxo of resp.data.data.utxos) {
                totalValue += +utxo.value;
            }
            Logger_1.default.info('Wallet balance: ' + totalValue);
            return totalValue;
        });
    }
    getTransactionFeeInLovelaces(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query getTransactionFee(
            $hash: Hash32Hex!
            ){
                transactions(
                    where: { hash: { _eq: $hashe }}
                ) {
                    fee
                    hash
                }
            }`,
                variables: {
                    hash: transactionHash
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return +resp.data.data.transactions[0].fee;
        });
    }
    getTransaction(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const respLB = yield axios_1.default.post(this.graphQLURL, {
                query: `query latestBlock  {
                  blocks ( 
                      where: {number: {_gt: 0}},
                      limit: 1, 
                      offset: 0, 
                      order_by: { number: desc }) {
                          number
                  }
              }`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query fullTransaction (
                  $hash: Hash32Hex!
              ){
                  transactions(
                      where: { hash: { _eq: $hash }}
                  ) {
                      fee
                      hash
                      blockIndex
                      metadata {
                          key
                          value
                      }    
                      block {
                          number
                          hash
                      }
                      inputs {
                          address
                          value
                          sourceTxHash
                          sourceTxIndex
                      } 
                      outputs {
                          address
                          value
                     }
                  }
              }`,
                variables: {
                    hash: transactionHash
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const inputs = [];
            for (const i of resp.data.data.transactions[0].inputs) {
                inputs.push({
                    address: i.address,
                    amount: +i.value,
                    txHash: i.sourceTxHash,
                    index: i.sourceTxIndex
                });
            }
            const outputs = [];
            for (const o of resp.data.data.transactions[0].outputs) {
                outputs.push({
                    address: o.address,
                    amount: +o.value
                });
            }
            let txmeta = '';
            try {
                const jmeta = resp.data.data.transactions[0].metadata[0].value[0];
                const bmeta = Buffer.from(jmeta.replace('0x', ''), 'hex');
                txmeta = bmeta.toString();
            }
            catch (error) {
                txmeta = '';
            }
            return {
                outputs: outputs,
                inputs: inputs,
                hash: resp.data.data.transactions[0].hash,
                fees: +resp.data.data.transactions[0].fee,
                blockHash: resp.data.data.transactions[0].block.hash,
                blockHeight: resp.data.data.transactions[0].block.number,
                index: resp.data.data.transactions[0].blockIndex,
                metadata: txmeta,
                blockConfirmations: respLB.data.data.blocks[0].number - resp.data.data.transactions[0].block.number,
                transactionNumber: TransactionNumber_1.default.construct(resp.data.data.transactions[0].block.number, resp.data.data.transactions[0].blockIndex)
            };
        });
    }
    getTxMetadataPage(page, batchSize) {
        return __awaiter(this, void 0, void 0, function* () {
            const txMetadatas = [];
            try {
                const resp = yield axios_1.default.post(this.graphQLURL, {
                    query: `query getMetadatas (
                    $label: String!
                    $count: Int!
                    $offset: Int!
                ){
                    transactions (
                        where: {metadata: {key: {_eq: $label}}},
                        offset: $offset
                        limit: $count,
                      order_by: {block: {number: desc}}
                      
                    ){
                        hash
                      block {
                        number
                      }
                      metadata  {
                        key
                        value
                      }
                    }
                    
                  }`,
                    variables: {
                        count: batchSize,
                        offset: batchSize * (page - 1),
                        label: this.cardanoMetadataLabel
                    }
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                for (const tx of resp.data.data.transactions) {
                    for (const meta of tx.metadata) {
                        if (meta.key === this.cardanoMetadataLabel) {
                            txMetadatas.push({
                                txHash: tx.hash,
                                jsonMetadata: meta.value,
                                cborMetadata: null
                            });
                        }
                    }
                }
                return txMetadatas;
            }
            catch (error) {
                return txMetadatas;
            }
        });
    }
    getLatestProtocolParameters() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query latestProtocolParams  {
          epochs ( 
              limit: 1  
              order_by: { number: desc }) {
                  number
                  protocolParams {
                    minFeeA
                  minFeeB
                    maxTxSize
                    keyDeposit
                    poolDeposit
                    minUTxOValue
                    maxValSize
                  }
          }
      }`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return {
                epoch: resp.data.data.epochs[0].number,
                minFeeA: resp.data.data.epochs[0].protocolParams.minFeeA,
                minFeeB: resp.data.data.epochs[0].protocolParams.minFeeB,
                maxTxSize: resp.data.data.epochs[0].protocolParams.maxTxSize,
                keyDeposit: resp.data.data.epochs[0].protocolParams.keyDeposit,
                poolDeposit: resp.data.data.epochs[0].protocolParams.poolDeposit,
                minUtxo: resp.data.data.epochs[0].protocolParams.minUTxOValue,
                maxValSize: resp.data.data.epochs[0].protocolParams.maxValSize
            };
        });
    }
    getLedgerTip() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield axios_1.default.post(this.graphQLURL, {
                query: `query latestBlock  {
          blocks ( 
              where: {number: {_gt: 0}},
              limit: 1, 
              offset: 0, 
              order_by: { number: desc }) {
                  forgedAt
                  number
                  hash
                  slotNo
                  epochNo
                  size
                  forgedAt
              }
            }`
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return {
                time: new Date(resp.data.data.blocks[0].forgedAt).getTime() / 1000,
                height: resp.data.data.blocks[0].number,
                hash: resp.data.data.blocks[0].hash,
                slot: resp.data.data.blocks[0].slotNo,
                epoch: resp.data.data.blocks[0].epochNo,
                size: resp.data.data.blocks[0].size,
                confirmations: 0
            };
        });
    }
}
exports.default = CardanoClient;
//# sourceMappingURL=CardanoClient_dandelion.js.map