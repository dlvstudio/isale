import { Helper } from './../providers/helper.service';
import { Product } from './product.model';
import { IProduct } from './product.interface';
import { Join } from './join.model';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';
import { ITrade } from './trade.interface';
import { IStaff } from './staff.interface';
import { Staff } from './staff.model';
import { IOrder } from './order.interface';
import { Order } from './order.model';
import { IMoneyAccount } from './money-account.interface';
import { MoneyAccount } from './money-account.model';
import { IDebt } from './debt.interface';
import { Debt } from './debt.model';
import { ReceivedNote } from './received-note.model';
import { IReceivedNote } from './received-note.interface';

export class Trade implements ITrade {
    id = 0;
    staffId = 0;
    contactId = 0;
    productId = 0;
    orderId = 0;
    debtId = 0;
    moneyAccountId = 0;
    isReceived = true;
    value = 0;
    note = '';
    createdAt = '';
    modifiedAt = '';
    isPurchase = false;
    productCount = 0;
    fee = 0;
    imageUrlsJson = '';
    avatarUrl = '';
    onlineId = 0;
    saveAccount: boolean = null;
    contact: IContact = new Contact();
    product: IProduct = new Product();
    order: IOrder = new Order();
    staff: IStaff = new Staff();
    debt: IDebt = new Debt();
    moneyAccount: IMoneyAccount = new MoneyAccount();
    receivedNoteId = 0;
    receivedNote: IReceivedNote = new ReceivedNote();
    transferNoteId = 0;
    transferNote: any = {};
    joins: Join[] = [
        new Join('contactId', 'contact', Helper.contactTableName),
        new Join('orderId', 'order', Helper.orderTableName),
        new Join('moneyAccountId', 'moneyAccount', Helper.moneyAccountTableName),
        new Join('receivedNoteId', 'receivedNote', Helper.receivedNoteTableName),
        new Join('productId', 'product', Helper.productTableName),
        new Join('debtId', 'debt', Helper.debtTableName)
    ];
}
