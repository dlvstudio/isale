import { ITrade } from './trade.interface';
import { ITradeCategory } from './trade-category.interface';
export interface ITradeToCategory {
    id: number;
    tradeId: number;
    categoryId: number;
    tradeCategory: ITradeCategory;
    trade: ITrade;
    onlineId: number;
}