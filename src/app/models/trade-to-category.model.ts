import { Helper } from './../providers/helper.service';
import { Trade } from './trade.model';
import { ITrade } from './trade.interface';
import { TradeCategory } from './trade-category.model';
import { Join } from './join.model';
import { ITradeCategory } from './trade-category.interface';
import { ITradeToCategory } from './trade-to-category.interface';
export class TradeToCategory implements ITradeToCategory{
    id = 0;
    tradeId = 0;
    categoryId = 0;
    onlineId = 0;
    tradeCategory: ITradeCategory = new TradeCategory();
    trade: ITrade = new Trade();
    joins: Join[] = [
        new Join('categoryId', 'tradeCategory', Helper.tradeCategoryTableName),
        new Join('tradeId', 'trade', Helper.tradeTableName),
    ];
}