export interface IReceivedNoteItem {
    id: number;
    receiptId: number;
    productId: number;
    barcode: string;
    productCode: string;
    productName: string;
    quantity: number;
    unit: string;
    basicUnit: string;
    unitExchange: number;
    unitPrice: number;
    costPrice: number;
    unitPriceForeign: number;
    foreignCurrency: string;
    amount: number;
    amountForeign: number;
    note: string;
    onlineId: number;
    isExpand: boolean;
    discount: number;
    discountPercent: number;
    // 0: %, 1: manual
    discountType: number;
    receivedDate: any;
    price: any;

}
