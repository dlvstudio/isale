import { IContact } from "./contact.interface";
import { IReceivedNoteItem } from "./received-note-item.interface";
import { IReceivedNote } from "./received-note.interface";
import { Contact } from "./contact.model";
import { Join } from "./join.model";
import { Helper } from "../providers/helper.service";
import { IMoneyAccount } from "./money-account.interface";
import { MoneyAccount } from "./money-account.model";
import { IStaff } from "./staff.interface";
import { Staff } from "./staff.model";

export class ReceivedNote implements IReceivedNote {
    id = 0;
    staffId = 0;
    staff: IStaff = new Staff();
    contactName: string;
    contactPhone: string;
    moneyAccountId = 0;
    moneyAccount: IMoneyAccount = new MoneyAccount();
    contactId = 0;
    contact: IContact = new Contact();
    total = 0;
    paid = 0;
    totalForeign: number;
    createdAt = '';
    deliveryPerson = '';
    foreignCurrency: string;
    receiver = '';
    onlineId = 0;
    items: IReceivedNoteItem[] = [];
    itemsJson = '';
    //0: %, 1: manual
    taxType = 0;
    tax = 0;
    netValue = 0;
    discount = 0;
    discountOnTotal = 0;
    shippingFee = 0;
    storeId = 0;
    store = null;
    joins: Join[] = [
        new Join('contactId', 'contact', Helper.contactTableName),
        new Join('moneyAccountId', 'moneyAccount', Helper.moneyAccountTableName)
    ];
    saveProductNotes = true;
    lang = '';
}