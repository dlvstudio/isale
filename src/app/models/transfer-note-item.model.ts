import { ITransferNoteItem } from './transfer-note-item.interface';

export class TransferNoteItem implements ITransferNoteItem  {
    id = 0;
    receiptId = 0;
    productId = 0;
    productCode = '';
    barcode = '';
    productName = '';
    actualExport = 0;
    actualImport = 0;
    unit = '';
    unitExchange = null;
    basicUnit = null;
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
    // 0: %, 1: manual
    discountType = 0;
}
