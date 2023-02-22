import { IOrderItem } from './../../models/order-item.interface';
import { IonSelect } from '@ionic/angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { IContact } from './../../models/contact.interface';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Order } from '../../models/order.model';
import { IOrder } from '../../models/order.interface';
import { IProduct } from '../../models/product.interface';
import { OrderItem } from '../../models/order-item.model';
import { IMoneyAccount } from '../../models/money-account.interface';
import { IMoneyAccountTransaction } from '../../models/money-account-transaction.interface';
import { Debt } from '../../models/debt.model';
import { ToastController, AlertController, IonInput, ModalController } from '@ionic/angular';
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
import { TableSearchComponent } from '../shop-table/search-shop-table.component';

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
    discounts = [];
    prices = [];
    order: IOrder = new Order();
    oldOrder: IOrder = null;
    currency: any = { code: 'vnd' };
    isNew = true;
    hideTax = false;
    barcode = '';
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

    constructor(
        private barcodeScanner: BarcodeScanner,
        private contactService: ContactService,
        private productService: ProductService,
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
        const code = await this.userService.getCurrentCurrency();
        this.hideTax = await this.userService.getHideTax();
        this.currency = Helper.getCurrencyByCode(code);
        const data = await this.orderService.getNewOrderData();
        this.isCollapsed = await this.userService.getOrderFormCollapsed();
        this.outStock = await this.userService.getOutstock();
        this.pointPaymentConfig = this.pointService.getPointPaymentConfigByInput(data.shopConfigs);
        this.pointConfigs = data.pointConfigs;
        this.order = new Order();
        this.order.status = 3;
        if (this.pointPaymentConfig && this.pointPaymentConfig.pointPaymentExchange) {
            this.order.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
        }
        this.order.orderCode = this.orderService.getOrderCode();
        this.order.createdAt = moment(new Date()).format(DateTimeService.getDateTimeDbFormat());
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
                this.order.contactAddress = this.params.convert.contactAddress;
                this.order.contactName = this.params.convert.contactName;
                this.order.contactPhone = this.params.convert.contactPhone;
                this.order.itemsJson = this.params.convert.itemsJson;
                this.order.items = JSON.parse(this.order.itemsJson);
                this.order.orderCode = this.params.convert.orderCode;
                this.order.total = 0;
                this.order.netValue = 0;
                this.order.paid = 0;
                this.order.change = 0;
                this.order.discountOnTotal = 0;
                this.order.tax = 0;
                this.order.shippingFee = 0;
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
                orderCopied.createdAt = null;
                this.contactSelected = orderCopied.contact;
                this.staffSelected = orderCopied.staff;
                this.contactSelected = orderCopied.contact;
                this.moneyAccountSelected = orderCopied.moneyAccount;
                this.order = orderCopied;
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
        this.navCtrl.push('/contact/search', { callback });
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
        this.navCtrl.push('/staff/search', { callback, storeFilter: this.store ? this.store.id : -1, shiftFilter });
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
                newContact.fullName = this.order.contactName;
                newContact.mobile = this.order.contactPhone;
                newContact.address = this.order.contactAddress;
                newContact.staffId = this.order.staffId;
                newContactId = await this.contactService.saveContact(newContact);
            }
            this.contactSelected = newContact;
            this.order.contactId = newContactId;
        }
        this.order.storeId = this.store ? this.store.id : 0;
        this.order.saveProductNotes = true;
        this.order.lang = await this.userService.getCurrentLanguage();
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
                        debt.orderId = this.order.id;
                        debt.value = this.order.total - this.order.paid;
                        debt.note = this.translateService.instant('order-add.paid-is-smaller-note');
                        debt.contactId = this.order.contactId;
                        debt.debtType = 3;
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
        this.navCtrl.push('/money-account/search', { callback });
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
        this.order.contactName = null;
        this.order.contactPhone = null;
        this.order.contactAddress = null;
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

    async showSearchProduct() {
        this.analyticsService.logEvent('order-add-search-product');
        const callback = (data) => {
            const product = data as IProduct;
            this.addProduct(product as IProduct);
        };
        this.navCtrl.push('/product/search', { callback });
    }

    async addProductFromArr(product: any, tradeToCategories: ITradeToCategory[]): Promise<void> {
        if (!product) {
            return;
        }

        const orderItem = new OrderItem();
        orderItem.price = product.price;
        // tslint:disable-next-line:no-string-literal
        orderItem['quantity'] = product.quantity;
        orderItem.discountPercent = product.discountPercent;
        orderItem.costPrice = product.costPrice ? product.costPrice : null;
        orderItem.productId = product.id;
        orderItem.isCombo = product.isCombo;
        orderItem.productCode = product.code;
        orderItem.productName = product.title;
        orderItem.productAvatar = product.avatarUrl;
        orderItem.unit = product.unit;
        orderItem.basicUnit = product.basicUnit;
        orderItem.unitExchange = product.unitExchange;
        orderItem.discount = product.discount ? product.discount : 0;
        orderItem.count = product.count;
        orderItem.isExpand = false;
        orderItem.options = product.options;
        orderItem.attributes = product.attributes;
        orderItem.initPrice = product.initPrice;
        orderItem.types = product.types;
        orderItem.typeAttributes = product.typeAttributes;
        orderItem.shopPrice = product.shopPrice;
        orderItem.typeOptions = product.typeOptions;
        orderItem.items = product.itemsJson ? JSON.parse(product.itemsJson) : [];
        orderItem.materials = product.materials && product.materials.length
            ? product.materials
            : product.materialsJson
                ? JSON.parse(product.materialsJson)
                : product.materials;
        const categories = [];
        if (tradeToCategories && tradeToCategories.length) {
            for (const category of tradeToCategories) {
                if (category.tradeId == orderItem.productId) {
                    categories.push(category);
                }
            }
        }
        orderItem.categories = categories;
        this.checkDiscount(orderItem);
        this.checkPrice(orderItem);
        this.order.items.unshift(orderItem);
        this.reCalc(orderItem);
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
                this.checkDiscount(item);
                this.checkPrice(item);
                this.reCalc(item);
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
            orderItem.price = selectedUnit ? selectedUnit.price : product.price;
            // tslint:disable-next-line:no-string-literal
            orderItem['quantity'] = product['quantity'] ? product['quantity'] : product.count;
            orderItem.costPrice = product.costPrice ? product.costPrice : null;
            orderItem.discountPercent = 0;
            orderItem.productId = product.id;
            orderItem.basicUnit = selectedUnit ? product.unit : null;
            orderItem.unitExchange = selectedUnit ? selectedUnit.exchange : null;
            orderItem.isCombo = product.isCombo;
            orderItem.productCode = product.code;
            orderItem.productName = product.title;
            orderItem.productAvatar = product.avatarUrl;
            orderItem.unit = selectedUnit ? selectedUnit.unit : product.unit;
            orderItem.count = 1;
            orderItem.isExpand = false;
            orderItem.shopPrice = product.shopPrice;
            orderItem.items = product.itemsJson ? JSON.parse(product.itemsJson) : [];
            orderItem.materials = product.materials && product.materials.length
                ? product.materials
                : product.materialsJson
                    ? JSON.parse(product.materialsJson)
                    : product.materials;
            this.tradeToCategories = await this.tradeService.getCategoriesToTrade(orderItem.productId);
            orderItem.categories = this.tradeToCategories;
            this.order.items.unshift(orderItem);
            this.checkDiscount(orderItem);
            this.checkPrice(orderItem);
            this.reCalc(orderItem);
            const mess = this.translateService.instant('order-add.added-product',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
            const left = product.count - orderItem.count;
            const mess3 = this.translateService.instant('product-selector.quantity-left') + ': ' + left;
            this.presentToast(mess + '. ' + mess3);
            this.barcodeFocus();
        }
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

    async removeProduct(orderItem: IOrderItem): Promise<void> {
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
        this.order.discount = discount * 1;
        if (this.discountPercent) {
            this.order.discountOnTotal = netValue * this.discountPercent / 100;
        }
        this.order.discount += this.order.discountOnTotal;
        netValue -= this.order.discountOnTotal;
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
                this.order.tax = this.taxTypeToRate() * (this.order.netValue - this.order.discount);
            }
        }
        if (this.order.status === 5) {
            this.order.paid = 0;
        } else {
            this.order.paid = this.order.total;
        }
        this.order.change = 0;
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

    async showOptions(orderItem) {
        const product: any = {};
        product.price = orderItem.price;
        product.id = orderItem.productId;
        product.code = orderItem.productCode;
        product.title = orderItem.productName;
        product.avatarUrl = orderItem.productAvatar;
        product.unit = orderItem.unit;
        product.count = orderItem.count;
        product.options = orderItem.options;
        product.total = orderItem.total;
        product.attributes = orderItem.attributes;
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
        const arr = [];
        for (const type of product.types) {
            const typeArr = [];
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price) {
                    typeArr.push(val.title);
                }
            }
            if (typeArr && typeArr.length) {
                const vals = typeArr.join(', ');
                arr.push(type.title + ': ' + vals);
            }
        }
        return arr.join('; ');
    }

    async showTypes(orderItem: IOrderItem) {
        this.analyticsService.logEvent('order-add-show-types');
        const product: any = {};
        product.price = orderItem.price;
        product.id = orderItem.productId;
        product.code = orderItem.productCode;
        product.title = orderItem.productName;
        product.avatarUrl = orderItem.productAvatar;
        product.unit = orderItem.unit;
        product.count = orderItem.count;
        product.options = orderItem.options;
        product.total = orderItem.total;
        product.types = orderItem.types;
        product.typeOptions = orderItem.typeOptions;
        product.typeAttributes = orderItem.typeAttributes;
        product.initPrice = orderItem.initPrice;
        const callback = (data) => {
            if (data) {
                orderItem.types = data.types;
                orderItem.typeOptions = this.getTypeOptions(data.types);
                orderItem.typeAttributes = this.getTypeAttributesString(orderItem);
                orderItem.initPrice = data.initPrice;
                orderItem.price = data.price ? data.price : orderItem.initPrice;
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
        const arr = [];
        for (const type of types) {
            for (const val of type.values) {
                if (!val.selected) {
                    continue;
                }
                if (!val.price) {
                    continue;
                }
                let existType = arr.find(t => t.id === type.id);
                if (!existType) {
                    existType = JSON.parse(JSON.stringify(type));
                    existType.values = [];
                    arr.push(existType);
                }
                if (!existType.values) {
                    existType.values = [];
                }
                existType.values.push(val);
            }
        }
        return arr;
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
        this.order.amountFromPoint = 0;
        this.order.pointPaymentExchange = 0;
        this.order.pointAmount = 0;
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
        const modal = await this.modalCtrl.create({
            component: TableSearchComponent
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (!data) {
            return;
        }
        this.table = data;
        this.order.tableId = data.id;
        this.order.status = 0;
    }
}
