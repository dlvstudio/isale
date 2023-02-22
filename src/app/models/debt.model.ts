import { Helper } from './../providers/helper.service';
import { IDebt } from './debt.interface';
import { Product } from './product.model';
import { IProduct } from './product.interface';
import { Join } from './join.model';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';
import { IOrder } from './order.interface';
import { Order } from './order.model';
import { IReceivedNote } from './received-note.interface';
import { ReceivedNote } from './received-note.model';
import { IStaff } from './staff.interface';
import { Staff } from './staff.model';

export class Debt implements IDebt{
    id = 0;
    code = '';
    contactId = 0;
    productId = 0;
    orderId = 0;
    receivedNoteId = 0;
    // 0: borrow who, 1: who borrow, 2: own who, 3: who own
    debtType = 0;
    value = 0;
    valuePaid = 0;
    countPaid = 0;
    note = '';
    createdAt = '';
    modifiedAt = '';
    isPurchase = false;
    productCount = 0;
    interestRate = 0;
    staffId = 0;
    storeId = 0;
    maturityDate = '';
    isPaid = false;
    onlineId = 0;
    contact: IContact = new Contact();
    product: IProduct = new Product();
    order: IOrder = new Order();
    receivedNote: IReceivedNote = new ReceivedNote();
    store: any = null;
    staff: IStaff = new Staff();
    joins: Join[] = [
        new Join('contactId', 'contact', Helper.contactTableName),
        new Join('productId', 'product', Helper.productTableName),
        new Join('receivedNoteId', 'receivedNote', Helper.receivedNoteTableName),
        new Join('orderId', 'order', Helper.orderTableName)
    ];
}