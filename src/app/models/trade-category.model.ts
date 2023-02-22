import { ITradeCategory } from './trade-category.interface';

export class TradeCategory implements ITradeCategory{
    id: number = 0;
    orderIndex: number = 0;
    title: string = '';
    createdAt: string = '';
    modifiedAt: string = '';
    onlineId: number = 0;
}