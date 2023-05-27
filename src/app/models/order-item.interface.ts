import { ITradeToCategory } from "./trade-to-category.interface";

export interface IOrderItem {
    productId: number;
    productCode: string;
    productName: string;
    productAvatar: string;
    isCombo: boolean;
    price: number;
    costPrice: number;
    initPrice: number;
    unit: string;
    basicUnit: string;
    unitExchange: number;
    count: number;
    quantity: number;
    total: number;
    totalCostPrice: number;
    discount: number;
    discountPercent: number;
    // 0: %, 1: manual
    discountType: number;
    isExpand: boolean;
    onlineId: number;
    staff: any;
    options: any;
    attributes: any;
    typeAttributes: any;
    types: any;
    typeOptions: any;
    items: any;
    note: string;
    materials: any[];
    discountInfo: any;
    priceInfo: any;
    shopPrice: number;
    categories: ITradeToCategory[];
}
