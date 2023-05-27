import { ITradeCategory } from './trade-category.interface';

export class TradeCategory implements ITradeCategory{
    id = 0;
    orderIndex = 0;
    title = '';
    createdAt = '';
    modifiedAt = '';
    onlineId = 0;
}