import { IOrderItem } from './order-item.interface';
import { ITradeToCategory } from './trade-to-category.interface';

export class OrderItem implements IOrderItem {
    productId = 0;
    productCode = '';
    productName = '';
    productAvatar = '';
    isCombo = false;
    price = 0;
    costPrice = null;
    initPrice = null;
    unit = '';
    basicUnit = null;
    unitExchange = null;
    count = 0;
    quantity = null;
    total = 0;
    totalCostPrice = null;
    discount = 0;
    discountPercent = 0;
    // 0: %, 1: manual
    discountType = 0;
    isExpand = true;
    onlineId = 0;
    staff: any = null;
    options: any = null;
    attributes: any = null;
    items: any = null;
    typeAttributes: any = null;
    types: any = null;
    typeOptions: any = null;
    note: string = null;
    materials = null;
    discountInfo = null;
    priceInfo = null;
    shopPrice = 0;
    categories: ITradeToCategory[] = null;
}
