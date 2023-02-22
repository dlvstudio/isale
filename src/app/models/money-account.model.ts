import { IMoneyAccount } from './money-account.interface';

export class MoneyAccount implements IMoneyAccount {
    id = 0;
    accountName = '';
    total = 0;
    createdAt = '';
    modifiedAt = '';
    isDefault = false;
    onlineId = 0;
    bankName = '';
    bankNumber = '';
    bankAccountName = '';
}
