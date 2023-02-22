import { Helper } from './../providers/helper.service';
import { IDebtToCategory } from './debt-to-category.interface';
import { Debt } from './debt.model';
import { IDebt } from './debt.interface';
import { TradeCategory } from './trade-category.model';
import { Join } from './join.model';
import { ITradeCategory } from './trade-category.interface';
export class DebtToCategory implements IDebtToCategory{
    id: number = 0;
    debtId: number = 0;
    categoryId: number = 0;
    onlineId: number = 0;
    tradeCategory: ITradeCategory = new TradeCategory();
    debt: IDebt = new Debt();
    joins: Join[] = [
        new Join('categoryId', 'tradeCategory', Helper.tradeCategoryTableName),
        new Join('debtId', 'debt', Helper.debtTableName),
    ];
}