import { ToastController, AlertController, IonInput, ModalController } from '@ionic/angular';
import { IonSelect } from '@ionic/angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { IOrderItem } from './../../models/order-item.interface';
import { IContact } from './../../models/contact.interface';
import { Order } from '../../models/order.model';
import { IOrder } from '../../models/order.interface';
import { OrderItem } from '../../models/order-item.model';
import { IMoneyAccount } from '../../models/money-account.interface';
import { IMoneyAccountTransaction } from '../../models/money-account-transaction.interface';
import { Debt } from '../../models/debt.model';
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { OrderService } from '../../providers/order.service';
import { DebtService } from '../../providers/debt.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { TradeService } from '../../providers/trade.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { MoneyAccountTransactionService } from '../../providers/money-account-transaction.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { Contact } from '../../models/contact.model';
import { StorageService } from '../../providers/storage.service';
import { StoreService } from '../../providers/store.service';
import { ITradeToCategory } from '../../models/trade-to-category.interface';
import { PointService } from '../../providers/point.service';
import { ShiftService } from '../../providers/shift.service';
import { PromotionService } from '../../providers/promotion.service';

@Component({
    selector: 'order-add',
    templateUrl: 'order-add.component.html',
})
export class OrderAddComponent {
    @ViewChild('selectTax', { static: false }) selectTax: IonSelect;
    @ViewChild('barcodeInput', { static: true }) barcodeInput: IonInput;
    tab = 'payment';
    contactSelected: IContact;
    staffSelected: any;
    pointPaymentConfig: any;
    pointConfigs: any;
    params: any = null;
    moneyAccountSelected: IMoneyAccount;
    moneyAccountTransaction: IMoneyAccountTransaction;
    promotions = [];
    discounts = [];
    prices = [];
    order: IOrder = new Order();
    oldOrder: IOrder = null;
    currency: any = { code: 'vnd' };
    isNew = true;
    hideTax = false;
    hidePromotionFunction = false;
    barcode = '';
    promotionCode = '';
    table: any;
    saveDisabled = false;
    outStock = false;
    isCollapsed = false;
    noPrompt = true;
    discountPercent = 0;
    totalProductAmount = 0;
    store: any;
    fromUnit: string;
    totalPoints = 0;
    isHideNoProductDescription = true;
    tradeToCategories: ITradeToCategory[] = [];
    shifts: any[] = [];
    flow;
    hideTablesFunction = false;
    blockEditingOrderPrice = false;

    constructor(
        private barcodeScanner: BarcodeScanner,
        private contactService: ContactService,
        private productService: ProductService,
        private promotionService: PromotionService,
        private shiftService: ShiftService,
        public staffService: StaffService,
        private pointService: PointService,
        private moneyAccountTransactionService: MoneyAccountTransactionService,
        private orderService: OrderService,
        private debtService: DebtService,
        public translateService: TranslateService,
        private userService: UserService,
        private toastCtrl: ToastController,
        private tradeService: TradeService,
        private alertCtrl: AlertController,
        private modalCtrl: ModalController,
        public navCtrl: RouteHelperService,
        public storage: StorageService,
        public storeService: StoreService,
        private analyticsService: AnalyticsService) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            if (!event.target || event.target.localName !== 'input') {
                return;
            }
            if (event.key === "Escape" || event.key === "Esc") {
                this.barcode = '';
            }
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    async ionViewDidEnter() {
        this.shifts = await this.shiftService.getAll();
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async expandCollapse() {
        if (!this.isCollapsed) {
            alert(this.translateService.instant('order-add.order-form-collapsed-alert'));
        }
        this.isCollapsed = !this.isCollapsed;
        await this.userService.setOrderFormCollapsed(this.isCollapsed);
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        const code = await this.userService.getAttr('current-currency');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.hidePromotionFunction = await this.userService.getAttr('hide-promotion-function');
        this.currency = Helper.getCurrencyByCode(code);
        const data = await this.orderService.getNewOrderData();
        this.isCollapsed = await this.userService.getOrderFormCollapsed();
        this.outStock = await this.userService.getAttr('out-stock');
        this.pointPaymentConfig = this.pointService.getPointPaymentConfigByInput(data.shopConfigs);
        this.hideTablesFunction = await this.userService.getAttr('hide-tables-function');
        this.pointConfigs = data.pointConfigs;
        this.order = new Order();
        this.order.status = 3;
        if (this.pointPaymentConfig && this.pointPaymentConfig.pointPaymentExchange) {
            this.order.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
        }
        this.blockEditingOrderPrice = this.staffService.permissionValue('block-editing-order-price');
        this.order.orderCode = this.orderService.getOrderCode();
        this.order.createdAt = this.getCurrent();
        this.params = this.navCtrl.getParams(this.params);
        const hideNoProduct = await this.storage.get('hide-no-product');
        this.isHideNoProductDescription = hideNoProduct && hideNoProduct === '1';
        let orderId = 0;
        let contactId = 0;
        let productId = 0;
        this.store = await this.storeService.getCurrentStore();
        this.noPrompt = true;
        if (this.params) {
            if (this.params && this.params.id) {
                orderId = this.params.id;
                this.isNew = false;
            } else if (this.params && this.params.contact) {
                contactId = +this.params.contact;
            } else if (this.params && this.params.product) {
                productId = +this.params.product;
                if (this.params && this.params.fromUnit) {
                    this.fromUnit = this.params.fromUnit;
                }
            }
            if (this.params.table) {
                this.table = this.params.table;
                this.order.status = 0;
                this.order.tableId = this.table.id;
            }
            if (this.params && this.params.convert) {
                Helper.copyFields(this.order, this.params.convert, ['contactAddress', 'contactName', 'contactPhone', 'itemsJson', 'orderCode'], null, {
                    items: JSON.parse(this.order.itemsJson)
                })
                Helper.setZero(this.order, ['total', 'netValue', 'paid', 'change', 'discountOnTotal', 'tax', 'shippingFee']);
                if (this.order.items && this.order.items.length) {
                    for (const item of this.order.items) {
                        this.reCalc(item);
                    }
                }
            }
            if (this.params && this.params.order && this.params.mode === 'copy') {
                const orderCopied = JSON.parse(JSON.stringify(this.params.order));
                orderCopied.id = 0;
                orderCopied.orderCode = this.orderService.getOrderCode();
                orderCopied.createdAt = this.getCurrent();
                this.contactSelected = orderCopied.contact;
                this.staffSelected = orderCopied.staff;
                this.contactSelected = orderCopied.contact;
                this.moneyAccountSelected = orderCopied.moneyAccount;
                this.order = orderCopied;
            }
            if (this.params && this.params.quote) {
                const quoteCopied = JSON.parse(JSON.stringify(this.params.quote));
                this.contactSelected = quoteCopied.contact;
                this.staffSelected = quoteCopied.staff;
                this.contactSelected = quoteCopied.contact;
                const order = new Order();
                Helper.copyObject(order, quoteCopied, null, {
                    orderCode: this.orderService.getOrderCode(),
                    createdAt: this.getCurrent(),
                    status: 3,
                    id: 0,
                });
                this.totalProductAmount = order.items && order.items.length
                    ? _.sumBy(order.items, (item: any) => item.total)
                    : 0;
                this.order = order;
            }
        }
        this.prices = data.customerPrices
        this.discounts = data.customerDiscounts;

        if (orderId && orderId > 0) {
            const loading = await this.navCtrl.loading();
            this.orderService.get(orderId).then(async (order) => {
                await loading.dismiss();
                this.contactSelected = order.contact && order.contact.id !== 0 ? order.contact : null;
                this.staffSelected = order.staff && order.staff.id !== 0
                    ? order.staff
                    : null;
                this.moneyAccountSelected = order.moneyAccount && order.moneyAccount.id !== 0 ? order.moneyAccount : null;
                if (!this.moneyAccountSelected && !this.staffService.isStaff()) {
                    if (this.store && this.store.moneyAccount) {
                        this.moneyAccountSelected = this.store.moneyAccount;
                        this.order.moneyAccountId = this.moneyAccountSelected.id;
                    } else {
                        const account = data.defaultAccount;
                        if (account) {
                            this.moneyAccountSelected = account;
                            this.order.moneyAccountId = account.id;
                        }
                    }
                }
                this.order = order;
                if (this.pointPaymentConfig && this.pointPaymentConfig.pointPaymentExchange) {
                    this.order.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
                }
                this.table = this.order.table;
                this.oldOrder = JSON.parse(JSON.stringify(order));
                this.order.items = JSON.parse(this.order.itemsJson);
                this.promotions = JSON.parse(this.order.promotionsJson);
                this.totalProductAmount = this.order.items && this.order.items.length
                    ? _.sumBy(this.order.items, (item: any) => item.total)
                    : 0;
                this.moneyAccountTransactionService.getMoneyAccountTransactionByOrder(orderId).then((trx) => {
                    this.moneyAccountTransaction = trx;
                });
                setTimeout(() => {
                    this.noPrompt = false;
                }, 2000);
            });
        } else {
            const taxTypeString = await this.storage.get('tax-type');
            this.order.taxType = taxTypeString ? +taxTypeString : 0;
            if (!this.staffService.isStaff()) {
                if (this.store && this.store.moneyAccount) {
                    this.moneyAccountSelected = this.store.moneyAccount;
                    this.order.moneyAccountId = this.moneyAccountSelected.id;
                } else {
                    const account = data.defaultAccount;
                    if (account) {
                        this.moneyAccountSelected = account;
                        this.order.moneyAccountId = account.id;
                    }
                }
            } else {
                this.staffSelected = this.staffService.selectedStaff;
            }
            if (contactId && contactId > 0) {
                const contact = await this.contactService.get(contactId);
                this.contactSelected = contact;
                this.order.contactId = contact.id;
            } else if (productId && productId > 0) {
                const product = await this.productService.get(productId, this.store ? this.store.id : 0);
                if (this.fromUnit) {
                    product.fromUnit = this.fromUnit;
                }
                this.addProduct(product);
            }
            if (this.params && this.params.flow && this.params.flow.fromUserId) {
                this.flow = this.params.flow;
                const contact = await this.contactService.searchContactByFbUserId(this.params.flow.fromUserId);
                if (contact) {
                    this.contactSelected = contact;
                    this.order.contactId = contact.id;
                } else {
                    this.order.contactName = this.flow.fromUserName;
                }
            }
            if (this.params && this.params.fbcomment && this.params.fbcomment.fromUserId) {
                const contact = await this.contactService.searchContactByFbUserId(this.params.fbcomment.fromUserId);
                if (contact) {
                    this.contactSelected = contact;
                    this.order.contactId = contact.id;
                } else {
                    this.order.contactName = this.params.fbcomment.fromUserName;
                }
            }
            if (this.params && this.params.products) {
                for (const product of this.params.products) {
                    await this.addProduct(product);
                }
            }
            this.barcodeFocus();
            setTimeout(() => {
                this.noPrompt = false;
            }, 2000);
        }

        if (this.params && this.params.convert) {
            this.reCalcTotal();
        }
    }

    getCurrent() {
        return moment(new Date()).format(DateTimeService.getDateTimeDbFormat());
    }

    calculatePoints() {
        this.totalPoints = 0;
        if (!this.pointConfigs || !this.pointConfigs.length) {
            return;
        }
        if (!this.order.items || !this.order.items.length) {
            return;
        }
        for (const input of this.order.items) {
            let configSelected = null;
            for (const config of this.pointConfigs) {
                if (!config.forAllCustomer) {
                    if (config.contactId != this.order.contactId) {
                        continue;
                    }
                }
                // find by product
                if (config.productId == input.productId) {
                    configSelected = config;
                    break;
                }
                // exclude if not product
                if (config.productId !== 0) {
                    continue;
                }
                // find by category
                for (const p of this.tradeToCategories) {
                    if (p.tradeId == input.productId && p.categoryId == config.categoryId) {
                        configSelected = config;
                        break;
                    }
                }
                // exclude if not category
                if (config.categoryId != 0) {
                    continue;
                }
                // find by contact
                if (config.contactId == this.order.contactId) {
                    configSelected = config;
                    break;
                }
                // exclude the other
                if (config.contactId != 0) {
                    continue;
                }
                configSelected = config;
            }
            if (configSelected == null) {
                continue;
            }
            const amount = input.total / configSelected.exchange;
            this.totalPoints += amount;
        }
    }

    checkDiscountOnChangeCustomer() {
        if (!this.discounts || !this.discounts.length) {
            return;
        }
        let needRecal = false;
        for (const orderItem of this.order.items) {
            const recalcItem = this.checkDiscount(orderItem);
            if (recalcItem) {
                this.reCalc(orderItem);
                needRecal = true;
            }
        }
        if (needRecal) {
            this.reCalcTotal();
        }
    }

    turnoffPromotions() {
        alert(this.translateService.instant('order-add.turn-off-promotions-alert'));
    }

    checkPriceOnChangeCustomer() {
        if (!this.prices || !this.prices.length) {
            return;
        }
        let needRecal = false;
        for (const orderItem of this.order.items) {
            const recalcItem = this.checkPrice(orderItem);
            if (recalcItem) {
                this.reCalc(orderItem);
                needRecal = true;
            }
        }
        if (needRecal) {
            this.reCalcTotal();
        }
    }

    calcDiscount(orderItem: IOrderItem, customerDiscount: any): any {
        if (customerDiscount.type === 0) {
            return customerDiscount.discountValue;
        }
        const discount = orderItem.price * orderItem.count * customerDiscount.discountValue / 100;
        return discount;
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('order-add');
    }

    showPromotionSelector() {
        this.analyticsService.logEvent('order-add-search-promotion');
        const callback = async (data) => {
            const promotion = data;
            if (!promotion) {
                return;
            }
            this.addPromotion(promotion);
        };
        const totalProductsAmount = this.order.items && this.order.items.length
            ? _.sumBy(this.order.items, (item: IOrderItem) => item.total)
            : 0;
        const totalProductsQuantity = this.order.items && this.order.items.length
            ? _.sumBy(this.order.items, (item: IOrderItem) => item.count)
            : 0;
        this.navCtrl.push('/promotion', { callback, searchMode: true, orderItems: this.order.items, orderItemsTotalAmount: this.totalProductAmount, totalProductsAmount, totalProductsQuantity });
    }

    async showSearchContact() {
        this.analyticsService.logEvent('order-add-search-contact');
        const callback = async (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact as IContact;
                this.order.contactId = contact.id;
                this.order.contactName = contact ? contact.fullName : null;
                this.order.contactPhone = contact ? contact.mobile : null;
                this.order.contactAddress = contact ? contact.address : null;
                this.checkDiscountOnChangeCustomer();
                this.checkPriceOnChangeCustomer();
                this.order.pointAmount = 0;
                if (this.order.amountFromPoint) {
                    this.order.amountFromPoint = 0;
                    this.reCalcTotal();
                }
                this.calculatePoints();
                return;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchStaff() {
        this.analyticsService.logEvent('order-add-search-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.staffSelected = staff;
                this.order.collaboratorId = staff.id;
                this.checkPriceOnChangeCustomer();
                this.checkDiscountOnChangeCustomer();
            }
        };
        let shiftFilter = -1;
        if (this.shifts && this.shifts.length) {
            const time = moment(new Date()).format("HH:mm:ss");
            for (const shift of this.shifts) {
                if (time >= shift.startTime && time <= shift.endTime) {
                    shiftFilter = shift.id;
                    break;
                }
            }
        }
        this.navCtrl.push('/staff', { callback, storeFilter: this.store ? this.store.id : -1, shiftFilter, searchMode: true });
    }

    ionViewLoaded() {
        this.barcodeFocus();
    }

    barcodeFocus(): void {
        if (!this.navCtrl.isNotCordova()) {
            return;
        }
        setTimeout(() => {
            this.barcodeInput.setFocus();
        }, 600);
    }

    validate(): boolean {
        const usePointPayment = this.contactSelected && this.contactSelected.point
            && this.pointPaymentConfig.allowPointPayment && this.pointPaymentConfig.pointPaymentExchange
            && this.contactSelected.buyCount >= this.pointPaymentConfig.pointPaymentAfterBuyCount;
        if (usePointPayment && this.order.pointAmount && this.order.pointAmount > this.contactSelected.point) {
            alert(this.translateService.instant('order-add.poin-amount-limit-alert'));
            return false;
        }
        if (!this.order.items || !this.order.items.length) {
            alert(this.translateService.instant('order-add.no-items-alert'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (this.saveDisabled) {
            return;
        }
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        for (const item of this.order.items) {
            // tslint:disable-next-line:no-string-literal
            delete item['quantity'];
        }
        this.order.itemsJson = JSON.stringify(this.order.items);
        this.order.promotionsJson = JSON.stringify(this.promotions);
        if (this.staffService.isStaff()) {
            this.order.staffId = this.staffService.selectedStaff.id;
        }
        if (this.order.paid && this.order.paid < this.order.total) {
            this.order.status = 5;
        }
        const loading = await this.navCtrl.loading();
        if (!this.contactSelected && this.order && this.order.contactName && this.order.contactPhone) {
            this.analyticsService.logEvent('order-add-new-contact');
            let newContact = null;
            let newContactId = null;
            const contactByPhone = await this.contactService.searchContactByPhone(this.order.contactPhone);
            if (contactByPhone && confirm(this.translateService.instant('order-add.contact-phone-duplicated', { name: contactByPhone.fullName, phone: contactByPhone.mobile }))) {
                newContact = contactByPhone;
                newContactId = contactByPhone.id;
            } else {
                newContact = new Contact();
                Helper.copyFields(newContact, this.order, ['staffId'], {
                    fullName: 'contactName',
                    mobile: 'contactPhone',
                    address: 'contactAddress'
                });
                newContactId = await this.contactService.saveContact(newContact);
            }
            this.contactSelected = newContact;
            this.order.contactId = newContactId;
        }
        this.order.storeId = this.store ? this.store.id : 0;
        this.order.saveProductNotes = true;
        this.order.lang = await this.userService.getAttr('current-language');
        this.orderService.saveOrder(this.order).then(async () => {
            this.analyticsService.logEvent('order-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            Promise.all(arr).then(async () => {
                // Done
                await loading.dismiss();
                this.saveDisabled = false;
                if (this.params && this.params.convert) {
                    const onlineOrder = this.params.convert;
                    onlineOrder.convertedOrderId = this.order.id;
                    onlineOrder.status = 3;
                    await this.orderService.saveOnlineOrder(onlineOrder);
                    this.navCtrl.publish('reloadOnlineOrder', onlineOrder);
                    this.navCtrl.publish('reloadOnlineOrderList', null);
                }
                if (this.order.paid !== null && this.order.paid < this.order.total && this.isNew) {
                    await this.confirmToCreateDebt();
                } else {
                    this.exitPage();
                }
            });
        });
    }

    async confirmToCreateDebt(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('order-add.paid-is-smaller-than-total-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const debt = new Debt();
                        Helper.copyFields(debt, this.order, ['contactId'],
                            {
                                orderId: 'id'
                            }, {
                            value: this.order.total - this.order.paid,
                            note: this.translateService.instant('order-add.paid-is-smaller-note'),
                            debtType: 3,
                        });
                        await this.debtService.saveDebt(debt);
                        this.exitPage();
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                        this.exitPage();
                    }
                }
            ]
        });
        await confirm.present();
    }

    saveLastActive(): Promise<number> {
        const action = 'trade';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactOrder', this.contactSelected.id);
            return result;
        });
    }

    async showSearchMoneyAccount() {
        this.analyticsService.logEvent('order-add-search-money-account');
        const callback = (data) => {
            const moneyAccount = data as IMoneyAccount;
            if (moneyAccount) {
                this.moneyAccountSelected = moneyAccount as IMoneyAccount;
                this.order.moneyAccountId = moneyAccount.id;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadOrderList');
        this.navCtrl.publish('reloadOrder', this.order);
        if (this.order.contact && this.contactSelected) {
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactOrder', this.contactSelected.id);
        }
        if (this.order.tableId > 0) {
            this.navCtrl.publish('reloadTable', this.table);
            this.navCtrl.publish('reloadTableList');
        }
        if (this.isNew && this.order.tableId === 0) {
            await this.navCtrl.navigateForward('/order/detail', { id: this.order.id });
        }
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.order.collaboratorId = 0;
        this.order.staffId = 0;
        this.checkDiscountOnChangeCustomer();
        this.checkPriceOnChangeCustomer();
    }

    removeContact(): void {
        this.contactSelected = null;
        this.order.contactId = 0;
        Helper.setNull(this.order, ['contactName', 'contactPhone', 'contactAddress']);
        this.checkDiscountOnChangeCustomer();
        this.checkPriceOnChangeCustomer();
        this.order.pointAmount = 0;
        if (this.order.amountFromPoint) {
            this.order.amountFromPoint = 0;
            this.reCalcTotal();
        }
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiLocalDateString(date);
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async showQuoteSelector() {
        this.analyticsService.logEvent('order-add-search-quote');
        const callback = async (data) => {
            if (!data || !data.length) {
                return;
            }
            for (const item of data) {
                this.order.items.unshift(item);
                this.reCalc(item);
            }
            this.barcodeFocus();
        };
        await this.navCtrl.push('/order/quote-selector', {
            callback,
            contactId: (this.contactSelected ? this.contactSelected.id : null),
            staffId: (this.staffSelected ? this.staffSelected.id : null),
        });
    }

    async showProductSelector() {
        this.analyticsService.logEvent('order-add-search-product');
        const callback = async (data) => {
            if (!data || !data.length) {
                return;
            }

            for (const item of this.order.items) {
                item.isExpand = false;
            }
            const ids = [];
            for (const product of data) {
                ids.push(product.id);
            }
            this.tradeToCategories = await this.tradeService.getCategoriesOfProducts(ids);
            for (const product of data) {
                this.addProductFromArr(product, this.tradeToCategories);
            }
            this.applyItemTotal();
            this.barcodeFocus();
        };
        await this.navCtrl.push('/order/product-selector', {
            callback,
            contactId: (this.contactSelected ? this.contactSelected.id : null),
            staffId: (this.staffSelected ? this.staffSelected.id : null),
        });
    }

    async addProductFromArr(product: any, tradeToCategories: ITradeToCategory[]): Promise<void> {
        if (!product) {
            return;
        }

        const orderItem = new OrderItem();
        const categories = [];
        if (tradeToCategories && tradeToCategories.length) {
            for (const category of tradeToCategories) {
                if (category.tradeId == product.id) {
                    categories.push(category);
                }
            }
        }
        Helper.copyObject(orderItem, product,
            {
                productId: "id",
                productCode: "code",
                productName: "title",
                productAvatar: "avatarUrl",
            }, {
            costPrice: product.costPrice ? product.costPrice : null,
            discount: product.discount ? product.discount : 0,
            isExpand: false,
            items: product.itemsJson ? JSON.parse(product.itemsJson) : [],
            materials: product.materials && product.materials.length
                ? product.materials
                : product.materialsJson
                    ? JSON.parse(product.materialsJson)
                    : product.materials,
            categories
        }
        );
        this.order.items.unshift(orderItem);
        this.checkDiscountAndPrice(orderItem);
        const mess = this.translateService.instant('order-add.added-product',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    checkPrice(orderItem: IOrderItem): boolean {
        let price = this.prices.find(dc =>
            dc.product && dc.product.id === orderItem.productId
            && this.contactSelected && dc.contact && dc.contact.id == this.contactSelected.id
        );
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === orderItem.productId
                && this.staffSelected && dc.staff && dc.staff.id == this.staffSelected.id
                && !dc.contact
            );
        }
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === orderItem.productId
                && this.staffSelected && dc.isCollaboratorPrice
                && !dc.contact
                && !dc.staff
            );
        }
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === orderItem.productId
                && !dc.contact
                && !dc.staff
                && !dc.isCollaboratorPrice
            );
        }
        if (!price) {
            if (orderItem.priceInfo && (
                !this.contactSelected && orderItem.priceInfo.contact
                || !this.staffSelected && orderItem.priceInfo.staff
                || !this.staffSelected && orderItem.priceInfo.isCollaboratorPrice
            )) {
                orderItem.price = orderItem.priceInfo.orginalPrice;
                orderItem.priceInfo = null;
                return true;
            }
            return false;
        }
        price.orginalPrice = orderItem.price;
        orderItem.price = price.price;
        orderItem.priceInfo = price;
        return true;
    }

    checkDiscount(orderItem: IOrderItem): boolean {
        // find discount of contact
        let discount = this.discounts.find(dc =>
            (
                dc.product && dc.product.id === orderItem.productId
                || dc.category && orderItem.categories && orderItem.categories.find(td => td.categoryId == dc.category.id) != null
            )
            && this.contactSelected && dc.contact && dc.contact.id == this.contactSelected.id
        );
        if (!discount) {
            // find discount of staff
            discount = this.discounts.find(dc =>
                (
                    dc.product && dc.product.id === orderItem.productId
                    || dc.category && orderItem.categories && orderItem.categories.find(td => td.categoryId == dc.category.id) != null
                )
                && this.staffSelected && dc.staff && dc.staff.id == this.staffSelected.id
                && !dc.contact
            );
        }
        if (!discount) {
            // find discount of general collaborator
            discount = this.discounts.find(dc =>
                (
                    dc.product && dc.product.id === orderItem.productId
                    || dc.category && orderItem.categories && orderItem.categories.find(td => td.categoryId == dc.category.id) != null
                )
                && this.staffSelected && dc.isCollaboratorPrice
                && !dc.contact
                && !dc.staff
            );
        }
        if (!discount) {
            // find discount of specific product
            discount = this.discounts.find(dc =>
                (
                    dc.product && dc.product.id === orderItem.productId
                    || dc.category && orderItem.categories && orderItem.categories.find(td => td.categoryId == dc.category.id) != null
                )
                && !dc.contact
                && !dc.staff
                && !dc.isCollaboratorPrice
            );
        }
        if (!discount) {
            if (orderItem.discountInfo && (
                !this.contactSelected && orderItem.discountInfo.contact
                || !this.staffSelected && orderItem.discountInfo.staff
                || !this.staffSelected && orderItem.discountInfo.isCollaboratorPrice
            )) {
                orderItem.discount = 0;
                orderItem.discountPercent = 0;
                orderItem.discountInfo = null;
                return true;
            }
            return false;
        }
        if (!discount.conditionQuantity || discount.conditionQuantity && orderItem.count >= discount.conditionQuantity) {
            orderItem.discount = this.calcDiscount(orderItem, discount);
            orderItem.discountPercent = discount.type !== 0 ? discount.discountValue : 0;
            orderItem.discountInfo = discount;
            return true;
        }

        return false;
    }

    checkDiscountAndPrice(item: IOrderItem) {
        this.checkDiscount(item);
        this.checkPrice(item);
        this.reCalc(item);
    }

    addPromotion(promotion) {
        const exist = this.promotions.find(p => p.id === promotion.id);
        if (exist) {
            alert(this.translateService.instant('order-add.promotion-added'));
            return;
        }
        if (!promotion.isActive) {
            alert(this.translateService.instant('order-add.promotion-is-not-activated'));
            return;
        }
        const promotionStartDate = DateTimeService.getMomentRefined(promotion.startDate).toDate();
        const promotionEndDate = DateTimeService.getMomentRefined(promotion.endDate).toDate();
        const momentCurrent = moment().startOf('day').toDate();
        if ((promotionStartDate > momentCurrent || promotionEndDate < momentCurrent)) {
            alert(this.translateService.instant('order-add.promotion-is-not-activated'));
            return;
        }
        this.promotions.unshift(promotion);
        this.applyItemTotal();
    }

    async addProduct(product: any): Promise<void> {
        if (product) {
            for (const item of this.order.items) {
                item.isExpand = false;
            }

            const idx = this.order.items.findIndex(item =>
                item.productId === product.id
                && (!item.attributes || !item.attributes.length)
                && (!item.options || !item.options.length)
                && (!item.typeOptions || !item.typeOptions.length)
                && (!item.typeAttributes || !item.typeAttributes.length)
            );

            if (idx >= 0) {
                const item = this.order.items[idx];
                item.isExpand = true;
                item.count = item.count * 1 + 1;
                this.checkDiscountAndPrice(item);
                const mess1 = this.translateService.instant('order-add.qty-product', { product: item.productName, count: item.count + '' });
                const left1 = product.count - item.count;
                const mess2 = this.translateService.instant('product-selector.quantity-left') + ': ' + left1;
                this.presentToast(mess1 + '. ' + mess2);
                return;
            }

            let selectedUnit = null;
            if (product.fromUnit) {
                const units = product.unitsJson ? JSON.parse(product.unitsJson) : null;
                if (units && units.length) {
                    for (const unit of units) {
                        if (unit && unit.unit === product.fromUnit) {
                            selectedUnit = unit;
                            break;
                        }
                    }
                }
            }

            const orderItem = new OrderItem();
            this.tradeToCategories = await this.tradeService.getCategoriesToTrade(product.id);
            Helper.copyFields(orderItem, product, ['isCombo', 'shopPrice'],
                {
                    productId: 'id',
                    productCode: 'code',
                    productName: 'title',
                    productAvatar: 'avatarUrl',
                    promotion: 'promotion'
                },
                {
                    price: selectedUnit ? selectedUnit.price : product.price,
                    quantity: product['quantity'] ? product['quantity'] : product.count,
                    costPrice: product.costPrice ? product.costPrice : null,
                    discountPercent: 0,
                    basicUnit: selectedUnit ? product.unit : null,
                    unitExchange: selectedUnit ? selectedUnit.exchange : null,
                    unit: selectedUnit ? selectedUnit.unit : product.unit,
                    count: 1,
                    isExpand: false,
                    items: product.itemsJson ? JSON.parse(product.itemsJson) : [],
                    materials: product.materials && product.materials.length
                        ? product.materials
                        : product.materialsJson
                            ? JSON.parse(product.materialsJson)
                            : product.materials,
                    categories: this.tradeToCategories,
                }
            );
            this.order.items.unshift(orderItem);
            this.checkDiscountAndPrice(orderItem);
            const mess = this.translateService.instant('order-add.added-product',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
            const left = product.count - orderItem.count;
            const mess3 = this.translateService.instant('product-selector.quantity-left') + ': ' + left;
            this.presentToast(mess + '. ' + mess3);
            this.barcodeFocus();
        }
    }

    async promotionCodeChanged(): Promise<void> {
        if (!this.promotionCode || this.promotionCode.length < 5) {
            return;
        }
        this.analyticsService.logEvent('order-add-barcode-entered');
        this.promotionService.searchByQrCode(this.promotionCode).then(async (promotion) => {
            if (!promotion) {
                return;
            }
            this.analyticsService.logEvent('order-add-barcode-entered-ok');
            this.addPromotion(promotion);
            this.promotionCode = '';
        });
    }

    async barcodeChanged(): Promise<void> {
        if (!this.barcode || this.barcode.length < 5) {
            return;
        }
        this.analyticsService.logEvent('order-add-barcode-entered');
        this.productService.searchByBarcode(this.barcode).then(async (product) => {
            if (!product) {
                return;
            }
            if (this.outStock && product.count <= 0) {
                this.analyticsService.logEvent('product-selector-outstock-alert');
                alert(this.translateService.instant('order-add.outstock-alert'));
                return;
            }
            this.analyticsService.logEvent('order-add-barcode-entered-ok');
            this.addProduct(product);
            this.barcode = '';
            this.barcodeFocus();
        });
    }

    async presentToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    }

    async removePromotion(promotion: any): Promise<void> {
        const idx = this.promotions.findIndex(item => item.id === promotion.id);
        if (idx >= 0) {
            this.promotions.splice(idx, 1);
        }
        this.analyticsService.logEvent('order-add-remove-promotion');
        this.applyItemTotal();
    }

    async removeProduct(orderItem: IOrderItem): Promise<void> {
        if (orderItem['promotion']) {
            this.removePromotionProduct(orderItem['promotion'], orderItem);
            return;
        }
        const idx = this.order.items.findIndex(item => item.productId === orderItem.productId && item.unit === orderItem.unit);
        if (idx >= 0) {
            this.order.items.splice(idx, 1);
        }
        this.analyticsService.logEvent('order-add-remove-item');
        this.applyItemTotal();
    }

    getOptionPrices(orderItem: IOrderItem) {
        return Helper.getOptionPrices(orderItem);
    }

    reCalc(orderItem: IOrderItem): void {
        let optionValue = 0;
        let optionCostPrice = 0;
        if (orderItem.options && orderItem.options.length) {
            for (const option of orderItem.options) {
                optionValue += option.count * option.price;
                optionCostPrice += option.costPrice ? option.count * option.costPrice : 0;
            }
        }

        const netTotal = orderItem.count * (orderItem.price + optionValue);
        const discount = orderItem.discount
            ? (orderItem.discountType === 0 ? orderItem.discount * 1 : (netTotal * orderItem.discount / 100))
            : 0;
        const total = netTotal - discount;
        orderItem.total = total;
        const totalCostPrice = orderItem.count * ((orderItem.costPrice ? orderItem.costPrice : 0) + optionCostPrice);
        orderItem.totalCostPrice = totalCostPrice ? totalCostPrice : null;
        this.applyItemTotal();
    }

    changeCount(product) {
        if (product.discountPercent) {
            product.discount = (product.price * product.count) * product.discountPercent / 100;
        }
        this.reCalc(product);
    }

    applyItemTotal(): void {
        let netValue = 0;
        let discount = 0;
        for (const item of this.order.items) {
            netValue += item.total * 1;
            discount += item.discount * 1;
        }
        this.totalProductAmount = netValue;
        this.order.totalPromotionDiscount = this.discountFromPromotions();
        this.order.discount = discount * 1;
        if (this.discountPercent) {
            this.order.discountOnTotal = netValue * this.discountPercent / 100;
        }
        this.order.discount += this.order.discountOnTotal;
        netValue -= this.order.discountOnTotal;
        netValue -= this.order.totalPromotionDiscount;
        this.order.netValue = netValue;
        this.taxTypeChanged();
        this.calculatePoints();
    }

    changeDiscountOnTotal() {
        this.applyItemTotal();
    }

    async expand(orderItem: IOrderItem): Promise<void> {
        const isExpand = !orderItem.isExpand;
        for (const item of this.order.items) {
            item.isExpand = false;
        }
        orderItem.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('order-add-expand');
        }
    }

    discountFromPromotions() {
        if (!this.promotions || !this.promotions.length) {
            return 0;
        }
        let totalPromotion = 0;
        for (const pro of this.promotions) {

            let netValue = 0;
            for (const oi of this.order.items) {
                if (
                    (pro.category && oi.categories && oi.categories.length && oi.categories.findIndex(cat => cat.categoryId === pro.category.id) >= 0)) {
                    netValue += oi.total;
                    continue;
                }
                if (
                    pro.product && oi.productId == pro.product.id
                ) {
                    netValue += oi.total;
                    continue;
                }
                netValue += oi.total;
            }

            let discount = pro.isPercent ? (pro.promotionValue * netValue / 100) : pro.promotionValue;
            discount = discount >= pro.promotionMaxValue ? pro.promotionMaxValue : discount;
            totalPromotion += discount;
            pro.discountValue = discount;
            if (pro.promotionProduct) {
                pro.promotionProduct.quantity = 1;
                pro.items = [pro.promotionProduct];
                pro.totalQuantity = 1;
            }
        }
        return totalPromotion;
    }

    reCalcTotal(calculateTax = false): void {
        let amountFromPoint = 0;
        if (this.contactSelected && this.contactSelected.point
            && this.pointPaymentConfig && this.pointPaymentConfig.allowPointPayment
            && this.order.pointAmount
            && this.pointPaymentConfig.pointPaymentExchange
        ) {
            amountFromPoint = this.order.pointAmount * this.pointPaymentConfig.pointPaymentExchange;
            this.order.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
        }

        const total = this.order.netValue * 1 + this.order.tax * 1 + (this.order.shipCostOnCustomer ? this.order.shippingFee * 1 : 0) - amountFromPoint;
        this.order.amountFromPoint = amountFromPoint;
        this.order.total = total >= 0 ? total : 0;
        if (calculateTax) {
            if (this.order.taxType === 0) {
                this.order.tax = 0;
            } else {
                this.order.tax = this.taxTypeToRate() * (this.order.netValue - this.order.discountOnTotal);
            }
        }
        if (this.order.status === 5) {
            this.order.paid = 0;
        } else {
            this.order.paid = this.order.total;
        }
        this.order.change = 0;
    }

    addPromotionProducts(promotion) {
        const totalQuantity = _.sum(this.order.items.filter(i => i['promotion'] && i['promotion'].id === promotion.id).map(i => i.count));
        if (totalQuantity >= promotion.maxPromotionQuantity) {
            alert(this.translateService.instant('order-add.promotion-max-quantity-alert'));
            return;
        }
        const callback = async (data) => {
            const product = data;
            if (!product) {
                return;
            }
            if (promotion.promotionProduct && promotion.promotionProduct.id !== product.id) {
                alert(this.translateService.instant('order-add.product-not-match-promotion'));
                return;
            }
            if (promotion.promotionCategory) {
                const categories = await this.tradeService.getCategoriesToTrade(product.id);
                if (!categories || !categories.length) {
                    alert(this.translateService.instant('order-add.product-not-match-promotion'));
                    return;
                }
                const isMatch = categories.findIndex(c => c.categoryId === promotion.promotionCategory.id) >= 0;
                if (!isMatch) {
                    alert(this.translateService.instant('order-add.product-not-match-promotion'));
                    return;
                }
            }
            const exist = this.order.items.find(i => i.productId === product.id && i['promotion'] && i['promotion'].id === promotion.id);
            if (exist) {
                return;
            }
            const productCloned = JSON.parse(JSON.stringify(product));
            productCloned.quantity = productCloned.count;
            productCloned.price = 0;
            productCloned.promotion = promotion;
            await this.addProduct(productCloned);
            promotion.totalQuantity = _.sum(this.order.items.filter(i => i['promotion'] && i['promotion'].id === promotion.id).map(i => i.count));
        };
        this.navCtrl.push('/product', { callback, searchMode: true, categorySelected: promotion.promotionCategory });
    }

    removePromotionProduct(promotionInput, item) {
        const promotion = this.promotions.find(p => p.id === promotionInput.id);
        if (!promotion) {
            return;
        }
        if (promotion.totalQuantity) {
            promotion.totalQuantity = promotion.totalQuantity - item.count;
        }
        const idx = this.order.items.findIndex(i => i.productId === item.productId && i.unit === item.unit);
        if (idx >= 0) {
            this.order.items.splice(idx, 1);
        }
    }

    reCalcChange(): void {
        const change = +this.order.paid - +this.order.total;
        this.order.change = change > 0 ? change : 0;
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('order-add-scan-barcode');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkBarcodeScaned(data.barcode, true);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkBarcodeScaned(barcodeData.text, false);
        });
    }

    async scanQr(): Promise<void> {
        this.analyticsService.logEvent('order-add-scan-qr');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkQrCodeScaned(data.barcode, true);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkQrCodeScaned(barcodeData.text, false);
        });
    }

    checkQrCodeScaned(qrcode, isweb) {
        this.promotionService.searchByQrCode(qrcode).then(async (promotion) => {
            if (!promotion) {
                return;
            }
            this.analyticsService.logEvent('order-add-scan-qr-code-from-' + (isweb ? 'web' : 'mobile') + '-ok');
            this.addPromotion(promotion);
        });
    }

    checkBarcodeScaned(barcode, isweb) {
        this.productService.searchByBarcode(barcode).then(async (product) => {
            if (!product) {
                return;
            }
            if (this.outStock && product.count <= 0) {
                this.analyticsService.logEvent('order-add-outstock-alert');
                alert(this.translateService.instant('order-add.outstock-alert'));
                return;
            }
            this.analyticsService.logEvent('order-add-scan-from-' + (isweb ? 'web' : 'mobile') + '-ok');
            this.addProduct(product);
            this.barcodeFocus();
        });
    }

    checkContactBarcodeScaned(barcode) {
        this.contactService.get(+barcode).then(async (contact) => {
            if (!contact) {
                return;
            }
            this.analyticsService.logEvent('order-add-scan-contact-ok');
            this.contactSelected = contact;
        });
    }

    removeMoneyAccount(): void {
        this.moneyAccountSelected = null;
        this.order.moneyAccountId = 0;
    }

    async increase(item) {
        if (item['promotion']) {
            this.increasePromotionProduct(item['promotion'], item);
            return;
        }
        const realQuantity = item.basicUnit !== item.unit && item.unitExchange
            ? (item.count + 1) * item.unitExchange
            : (item.count + 1);

        if (this.outStock && ((item.quantity - realQuantity) <= 0) && !item.isService && !item.isCombo) {
            this.analyticsService.logEvent('product-selector-outstock-alert');
            alert(this.translateService.instant('order-add.outstock-alert'));
            return;
        }
        this.analyticsService.logEvent('order-add-increase');
        item.count++;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        this.reCalc(item);
        this.barcodeFocus();
    }

    async decrease(item) {
        if (item['promotion']) {
            this.decreasePromotionProduct(item['promotion'], item);
            return;
        }
        if (item && item.count === 0) {
            return;
        }
        this.analyticsService.logEvent('order-add-decrease');
        item.count--;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        this.reCalc(item);
        this.barcodeFocus();
    }

    async increasePromotionProduct(promotionInput, item) {
        const totalQuantity = _.sum(this.order.items.filter(i => i['promotion'] && i['promotion'].id === promotionInput.id).map(i => i.count));
        if (totalQuantity >= promotionInput.maxPromotionQuantity) {
            alert(this.translateService.instant('order-add.promotion-max-quantity-alert'));
            return;
        }
        const promotion = this.promotions.find(p => p.id === promotionInput.id);
        if (!promotion) {
            return;
        }
        promotion.totalQuantity++;
        item.count++;
    }

    async decreasePromotionProduct(promotionInput, item) {
        const promotion = this.promotions.find(p => p.id === promotionInput.id);
        if (!promotion) {
            return;
        }
        if (item && item.count === 0) {
            return;
        }
        if (promotion.totalQuantity) {
            promotion.totalQuantity--;
        }
        item.count--;
    }

    async showOptions(orderItem) {
        const product: any = {};
        Helper.copyFields(product, orderItem, ['price', 'unit', 'count', 'options', 'total', 'attributes'], {
            id: 'productId',
            code: 'productCode',
            title: 'productName',
            avatarUrl: 'productAvatar',
        });
        this.analyticsService.logEvent('order-add-show-options');
        const callback = (data) => {
            if (data) {
                orderItem.options = data.options;
                orderItem.attributes = data.attributes;
                this.reCalc(orderItem);
            }
        };
        await this.navCtrl.push('/order/option-selector', {
            callback,
            mainProduct: JSON.parse(JSON.stringify(product))
        });
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    taxTypeToRate() {
        if (this.order.taxType === 0) {
            return 0;
        }
        const taxTypeValue = this.order.taxType !== 10
            ? this.order.taxType
            : 0.6;
        return (taxTypeValue - 1) * 0.05 + 0.1;
    }

    async taxTypeChanged(prompt = false) {
        if (!this.noPrompt && prompt) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('order-add.save-tax-type-alert'),
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: async () => {
                            await this.storage.set('tax-type', this.order.taxType + '');
                        }
                    },
                    {
                        text: this.translateService.instant('order-add.save-tax-type-only-one'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.analyticsService.logEvent('order-add-tax-type-changed');
        }
        if (this.order.taxType === 0) {
            this.order.tax = 0;
            this.reCalcTotal();
            return;
        }
        this.order.tax = this.taxTypeToRate() * this.order.netValue;
        this.reCalcTotal();
    }

    openTaxType() {
        this.analyticsService.logEvent('order-add-tax-type-open');
        this.selectTax.open();
    }

    changeOrderStatus() {
        if (this.order && this.order.status === 5) {
            this.order.paid = 0;
        }
    }

    async openProductDiscountPercent(item: IOrderItem) {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('order-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('order-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: item.discountPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('order-add.remove-percent'),
                    handler: () => {
                        item.discountPercent = 0;
                        item.discount = 0;
                        this.reCalc(item);
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async (inputs: any) => {
                        if (!inputs) {
                            return;
                        }
                        const percent = +inputs.discountPercent;
                        if (percent < 0 || percent > 100) {
                            alert(this.translateService.instant('order-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('order-add-change-discount-percent');
                        if (percent) {
                            item.discountPercent = percent;
                            item.discount = (item.price * item.count) * percent / 100;
                            this.reCalc(item);
                        }
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await discountDialog.present();
    }

    async openDiscountPercent() {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('order-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('order-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('order-add.remove-percent'),
                    handler: () => {
                        this.discountPercent = 0;
                        this.applyItemTotal();
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async (inputs: any) => {
                        if (!inputs) {
                            return;
                        }
                        const percent = +inputs.discountPercent;
                        if (percent < 0 || percent > 100) {
                            alert(this.translateService.instant('order-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('order-add-change-discount-percent');
                        this.discountPercent = percent;
                        this.applyItemTotal();
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await discountDialog.present();
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    async showTypes(orderItem: IOrderItem) {
        this.analyticsService.logEvent('order-add-show-types');
        const product: any = {};
        Helper.copyFields(product, orderItem, ['price', 'unit', 'count', 'options', 'total', 'types', 'typeOptions', 'typeAttributes', 'initPrice'], {
            id: 'productId',
            code: 'productCode',
            title: 'productName',
            avatarUrl: 'productAvatar',
        });
        const callback = (data) => {
            if (data) {
                Helper.copyFields(orderItem, data, ['types', 'initPrice'], null, {
                    typeOptions: this.getTypeOptions(data.types),
                    typeAttributes: this.getTypeAttributesString(orderItem),
                    price: data.price ? data.price : orderItem.initPrice
                });
                this.reCalc(orderItem);
            }
        };
        const mainProduct = JSON.parse(JSON.stringify(product));
        mainProduct.price = product.initPrice ? product.initPrice : product.price;
        mainProduct.changedPrice = 0;
        await this.navCtrl.push('/product/type-selector', {
            callback,
            mainProduct
        });
    }

    getTypeOptions(types): any[] {
        return Helper.getTypeOptions(types);
    }

    async hideNoProductDescription() {
        this.isHideNoProductDescription = true;
        await this.storage.set('hide-no-product', '1');
    }

    async changePhone() {
        if (this.contactSelected) {
            return;
        }
        if (!this.order.contactPhone) {
            return;
        }
        const contact = await this.contactService.searchContactByPhone(this.order.contactPhone);
        if (contact) {
            const mess = this.translateService.instant('order-add.found-phone', { contact: contact.fullName, mobile: contact.mobile });
            if (confirm(mess)) {
                this.contactSelected = contact;
                this.order.contactId = contact.id;
                this.order.contactName = contact ? contact.fullName : null;
                this.order.contactPhone = contact ? contact.mobile : null;
                this.order.contactAddress = contact ? contact.address : null;
            }
        }
    }

    spendAll() {
        if (!this.contactSelected || !this.contactSelected.point) {
            return;
        }
        this.order.pointAmount = this.contactSelected.point;
    }

    clearAll() {
        this.order.pointAmount = null;
    }

    changeUsePointPayment() {
        Helper.setZero(this.order, ['amountFromPoint', 'pointPaymentExchange', 'pointAmount']);
        this.reCalcTotal();
    }

    async scanContact() {
        this.analyticsService.logEvent('order-add-scan-contact-barcode');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkContactBarcodeScaned(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkContactBarcodeScaned(barcodeData.text);
        });
    }

    async selectTable() {
        this.analyticsService.logEvent('order-add-search-table');
        const callback = async (data) => {
            if (!data) {
                return;
            }
            this.table = data;
            this.order.tableId = data.id;
            this.order.status = 0;
        };
        this.navCtrl.push('/table', { callback, searchMode: true });
    }
}
