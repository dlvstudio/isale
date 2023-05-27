import { IReceivedNoteItem } from './received-note-item.interface';

export class ReceivedNoteItem implements IReceivedNoteItem  {
    id = 0;
    receiptId = 0;
    productId = 0;
    productCode = '';
    barcode = '';
    productName = '';
    quantity = 0;
    unit = '';
    basicUnit: string = null;
    unitExchange: number = null;
    unitPrice = 0;
    costPrice: number = null;
    unitPriceForeign: number;
    foreignCurrency = '';
    amount = 0;
    amountForeign: number;
    note = '';
    isExpand = false;
    onlineId = 0;
    discount = 0;
    discountPercent = 0;
    // 0: %, 1: manual
    discountType = 0;
    receivedDate = null;
    price = null;
}
