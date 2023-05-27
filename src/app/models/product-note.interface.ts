import { IProduct } from './product.interface';
import { IContact } from './contact.interface';
import { IOrder } from './order.interface';
import { IReceivedNote } from './received-note.interface';

export interface IProductNoteItem {
    id: number;
    receivedNoteId: number;
    transferNoteId: number;
    productId: number;
    contactId: number;
    staffId: number;
    orderId: number;
    tradeId: number;
    product: IProduct;
    contact: IContact;
    order: IOrder;
    receivedNote: IReceivedNote;
    transferNote: any;
    productCode: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    unitCostPrice: number;
    unitPriceForeign: number;
    foreignCurrency: string;
    amount: number;
    amountForeign: number;
    note: string;
    onlineId: number;
    discount: number;
    // 0: %, 1: manual
    discountType: number;
    createdAt: string;
    modifiedAt: string;
    trade: any;
    storeId: number;
    store: any;
    basicUnit: string;
    unitExchange: number;
    staff: any;
    materials: any[];
    receivedDate: any;
}
