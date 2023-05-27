import { IContact } from './contact.interface';
import { IReceivedNoteItem } from './received-note-item.interface';
import { IMoneyAccount } from './money-account.interface';
import { IStaff } from './staff.interface';

export interface IReceivedNote {
    id: number;
    contactName: string;
    contactPhone: string;
    contactId: number;
    contact: IContact;
    staffId: number;
    staff: IStaff;
    total: number;
    paid: number;
    totalForeign: number;
    createdAt: string;
    deliveryPerson: string;
    foreignCurrency: string;
    receiver: string;
    onlineId: number;
    items: IReceivedNoteItem[];
    itemsJson: string;
    moneyAccountId: number;
    moneyAccount: IMoneyAccount;
    // 0: %, 1: manual
    taxType: number;
    tax: number;
    netValue: number;
    discount: number;
    discountOnTotal: number;
    shippingFee: number;
    storeId: number;
    store: any;
    saveProductNotes: boolean;
    lang: string;
}