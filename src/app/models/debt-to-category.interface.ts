import { IDebt } from './debt.interface';
import { ITradeCategory } from './trade-category.interface';
export interface IDebtToCategory {
    id: number;
    debtId: number;
    categoryId: number;
    tradeCategory: ITradeCategory;
    debt: IDebt;
    onlineId: number;
}