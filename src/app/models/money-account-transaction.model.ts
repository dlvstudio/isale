import { IMoneyAccount } from './money-account.interface';
import { Join } from './join.model';
import { Helper } from '../providers/helper.service';
import { IMoneyAccountTransaction } from './money-account-transaction.interface';
import { MoneyAccount } from './money-account.model';
import { ITrade } from './trade.interface';
import { Trade } from './trade.model';
import { IOrder } from './order.interface';
import { Order } from './order.model';

export class MoneyAccountTransaction implements IMoneyAccountTransaction{
    id = 0;
    tradeId = 0;
    orderId = 0;
    moneyAccountId = 0;
    moneyAccount: IMoneyAccount = new MoneyAccount();
    trade: ITrade = new Trade();
    order: IOrder = new Order();
    note = '';
    value = 0;
    transferFee = 0;
    createdAt = '';
    onlineId = 0;
    joins: Join[] = [
        new Join('moneyAccountId', 'moneyAccount', Helper.moneyAccountTableName)
        , new Join('tradeId', 'trade', Helper.tradeTableName)
        , new Join('orderId', 'order', Helper.orderTableName)
    ];
}