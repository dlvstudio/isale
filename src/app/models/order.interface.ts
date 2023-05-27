import { IOrderItem } from './order-item.interface';
import { IContact } from './contact.interface';
import { IMoneyAccount } from './money-account.interface';

export interface IOrder {
    id: number;
    orderCode: string;
    contactId: number;
    moneyAccountId: number;
    staffId: number;
    collaboratorId: number;
    contact: IContact;
    moneyAccount: IMoneyAccount;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    shippingFee: number;
    //0: %, 1: manual
    taxType: number;
    tax: number;
    netValue: number;
    discount: number;
    discountOnTotal: number;
    totalPromotionDiscount: number;
    total: number;
    //0: draft, 1: inprogress, 2: shipping, 3: done
    status: number;
    items: IOrderItem[];
    itemsJson: string;
    createdAt: string;
    onlineId: number;
    tableId: number;
    change: number;
    paid: number;
    table: any;
    staff: any;
    note: string;
    storeId: number;
    store: any;
    billOfLadingCode: string;
    shippingPartner: string;
    shipperName: string;
    shipperPhone: string;
    deliveryAddress: string;
    shipperId: number;
    hasShipInfo: boolean;
    saveProductNotes: boolean;
    lang: string;
    pointAmount: number;
    pointPaymentExchange: number;
    amountFromPoint: number;
    shipCostOnCustomer: boolean;
    promotions: any[];
    promotionsJson: string;
}