import { Helper } from './../providers/helper.service';
import { Join } from './join.model';
import { IContact } from './contact.interface';
import { Contact } from './contact.model';
import { IOrder } from './order.interface';
import { IOrderItem } from './order-item.interface';
import { IStaff } from './staff.interface';
import { Staff } from './staff.model';
import { IMoneyAccount } from './money-account.interface';
import { MoneyAccount } from './money-account.model';

export class Order implements IOrder {
    id = 0;
    orderCode = '';
    contactId = 0;
    staffId = 0;
    collaboratorId = 0;
    moneyAccountId = 0;
    contactName = '';
    contactPhone = '';
    contactAddress = '';
    shippingFee = 0;
    //0: %, 1: manual
    taxType = 0;
    tax = 0;
    netValue = 0;
    discount = 0;
    discountOnTotal = 0;
    totalPromotionDiscount = 0;
    total = 0;
    //0: draft, 1: inprogress, 2: shipping, 3: done, 4: cancel
    status = 0;
    items: IOrderItem[] = [];
    itemsJson = '';
    contact: IContact = new Contact();
    staff: IStaff = new Staff();
    moneyAccount: IMoneyAccount = new MoneyAccount();
    createdAt = '';
    onlineId = 0;
    paid = 0;
    tableId = 0;
    table: any = {};
    change = 0;
    joins: Join[] = [
        new Join('contactId', 'contact', Helper.contactTableName),
        new Join('moneyAccountId', 'moneyAccount', Helper.moneyAccountTableName)
    ];
    note: string;
    storeId = 0;
    store = null;
    billOfLadingCode = null;
    shippingPartner = null;
    shipperName = null;
    shipperPhone = null;
    deliveryAddress = null;
    shipperId = 0;
    hasShipInfo = false;
    saveProductNotes = true;
    lang = '';
    pointAmount = 0;
    pointPaymentExchange = 0;
    amountFromPoint = 0;
    shipCostOnCustomer = true;
    promotions = [];
    promotionsJson = '';
}