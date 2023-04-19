import CardanoClient from './CardanoClient.ts';
import ValueTimeLockModel from 'sidetree/common/models/ValueTimeLockModel.ts';
import SidetreeError from 'sidetree/common/SidetreeError.ts';
import ErrorCode from './ErrorCode.ts';
import LockTransactionType from './models/SavedLockType.ts';
import SavedLockModel from './models/SavedLockedModel.ts';
import Logger from 'sidetree/common/Logger.ts';

// import VersionManager from '../VersionManager';

/* global NodeJS */

/** Enum (internal to this class) to track the status of the lock. */
enum LockStatus {
  Confirmed = 'confirmed',
  None = 'none',
  Pending = 'pending'
}

/**
 * Structure (internal to this class) to track the state of the lock.
 */
interface LockState {
  activeValueTimeLock: ValueTimeLockModel | undefined;
  latestSavedLockInfo: SavedLockModel | undefined;

  status: LockStatus;
}

/**
 * Monitor for the running Cardano service.
 */
export default class Monitor {

  public constructor (private cardanoClient: CardanoClient) { }

  /**
   * Gets the size of the operation queue.
   */
  public async getWalletBalance (): Promise<any> {
    const walletBalanceInLovelaces = await this.cardanoClient.getBalanceInLovelaces();
    const walletBalanceInAda = walletBalanceInLovelaces / 100000000;
    return { walletBalanceInAda };
  }

  /**
   * Gets the current lock information if exist; undefined otherwise. Throws an error
   * if the lock information is not confirmed on the blockchain.
   */
  public async getCurrentValueTimeLock (): Promise<ValueTimeLockModel | undefined> {
    const currentLockState = await this.getCurrentLockState();

    // If there's no lock then return undefined
    if (currentLockState.status === LockStatus.None) {
      return undefined;
    }

    if (currentLockState.status === LockStatus.Pending) {
      // Throw a very specific error so that the caller can do something
      // about it if they have to
      throw new SidetreeError(ErrorCode.LockMonitorCurrentValueTimeLockInPendingState);
    }

    return currentLockState.activeValueTimeLock;
  }

  private async getCurrentLockState (): Promise<LockState> {

    const lastSavedLock = await this.cardanoClient.getLedgerTip();

    // Nothing to do if there's nothing found.
    if (!lastSavedLock) {
      return {
        activeValueTimeLock: undefined,
        latestSavedLockInfo: undefined,
        status: LockStatus.None
      };
    }

    Logger.info(`Found last saved lock of slot: ${lastSavedLock.slot} with transaction id: ${lastSavedLock.hash}.`);

    // Make sure that the last lock txn is actually broadcasted to the blockchain. Rebroadcast
    // if it is not as we don't want to do anything until last lock information is at least
    // broadcasted.
//    if (!(await this.isTransactionBroadcasted(lastSavedLock.transactionId))) {
//      return {
//        activeValueTimeLock: undefined,
//        latestSavedLockInfo: lastSavedLock,
//        status: LockStatus.Pending
//      };
//    }
//
//    if (lastSavedLock.type === SavedLockType.ReturnToWallet) {
//      // This means that there's no current lock for this node. Just return
//      return {
//        activeValueTimeLock: undefined,
//        latestSavedLockInfo: lastSavedLock,
//        status: LockStatus.None
//      };
//    }
//
//    // If we're here then it means that we have saved some information about a lock
//    // which is at least broadcasted to blockchain. Let's resolve it.
//    const lastLockIdentifier: LockIdentifier = {
//      transactionId: lastSavedLock.transactionId,
//      redeemScriptAsHex: lastSavedLock.redeemScriptAsHex
//    };
    const ownerAddress = await this.cardanoClient.getAddress().toString(); 

    const currentValueTimeLock = {
        identifier: lastSavedLock.hash,

        /** The amount that is locked */
        amountLocked: 1,

        /** At this transaction time the lock became active */
        lockTransactionTime: lastSavedLock.time, 

        /** At this transaction time the lock is no longer valid */
        unlockTransactionTime: lastSavedLock.time + 1000,

        /** The normalized fee for the block when lock became active */
        normalizedFee: 1,

        /** The owner of the lock */
        owner: ownerAddress

    };

    const savedLockInfo = { 
        transactionHash: lastSavedLock.hash,
        rawTransaction: '',
        datum: '',
        redeemScriptAsHex: '',
        desiredLockAmountInAda: 0,
        createTimestamp: 0,
        type: LockTransactionType.Create
    }; 

//    try {
      //await this.lockResolver.resolveLockIdentifierAndThrowOnError(lastLockIdentifier);

    Logger.info(`Found a valid current lock: ${JSON.stringify(currentValueTimeLock)}`);

    return {
        activeValueTimeLock: currentValueTimeLock,
        latestSavedLockInfo: savedLockInfo,
        status: LockStatus.Confirmed
    };

//    } catch (e) {
//
//      if (e instanceof SidetreeError &&
//        (e.code === ErrorCode.LockResolverTransactionNotConfirmed 
//         || e.code === ErrorCode.LockResolverTransactionNotFound)) {
//        // This means that the transaction was broadcasted but hasn't been written on the blockchain yet, or
//        // transaction was broadcasted, but hasn't been observed by `CardanoProcessor` yet.
//        return {
//          activeValueTimeLock: undefined,
//          latestSavedLockInfo: lastSavedLock,
//          status: LockStatus.Pending
//        };
//      }
//
      // Else this is an unexpected exception rethrow
//      throw e;
//    }
  }


}
