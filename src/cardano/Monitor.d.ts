import CardanoClient from './CardanoClient';
import ValueTimeLockModel from '@k-solutions/sidetree/dist/lib/common/models/ValueTimeLockModel';
export default class Monitor {
    private cardanoClient;
    constructor(cardanoClient: CardanoClient);
    getWalletBalance(): Promise<any>;
    getCurrentValueTimeLock(): Promise<ValueTimeLockModel | undefined>;
    private getCurrentLockState;
}
