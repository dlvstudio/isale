import { IMoneyAccount } from "./money-account.interface";
import { IOrder } from "./order.interface";
import { ITrade } from "./trade.interface";

export interface IMoneyAccountTransaction {
    id: number;
    tradeId: number;
    orderId: number;
    moneyAccountId: number;
    moneyAccount: IMoneyAccount;
    trade: ITrade;
    order: IOrder;
    note: string;
    value: number;
    transferFee: number;
    createdAt: string;
    onlineId: number;
}