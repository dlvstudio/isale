import { IProduct } from './product.interface';
import { IContact } from './contact.interface';
import { IOrder } from './order.interface';
import { IReceivedNote } from './received-note.interface';
import { IStaff } from './staff.interface';
export interface IDebt {
    id: number;
    code: string;
    contactId: number;
    productId: number;
    orderId: number;
    receivedNoteId: number;
    // 0: borrow who, 1: who borrow, 2: own who, 3: who own
    debtType: number;
    value: number;
    valuePaid: number;
    countPaid: number;
    note: string;
    createdAt: string;
    modifiedAt: string;
    contact: IContact;
    product: IProduct;
    order: IOrder;
    receivedNote: IReceivedNote;
    isPurchase: boolean;
    productCount: number;
    interestRate: number;
    maturityDate:string;
    isPaid:boolean;
    onlineId: number;
    staffId: number;
    staff: IStaff;
    storeId: number;
    store: any;
}