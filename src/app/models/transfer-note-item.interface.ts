export interface ITransferNoteItem {
    id: number;
    receiptId: number;
    productId: number;
    barcode: string;
    productCode: string;
    productName: string;
    actualExport: number;
    actualImport: number;
    unit: string;
    unitExchange: number;
    basicUnit: string;
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
    // 0: %, 1: manual
    discountType: number;
}
