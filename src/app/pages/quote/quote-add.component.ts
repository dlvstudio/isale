import { ToastController, AlertController, IonInput, ModalController } from '@ionic/angular';
import { IonSelect } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { IContact } from './../../models/contact.interface';
import { IProduct } from '../../models/product.interface';
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { StaffService } from '../../providers/staff.service';
import { UserService } from '../../providers/user.service';
import { TradeService } from '../../providers/trade.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Contact } from '../../models/contact.model';
import { StorageService } from '../../providers/storage.service';
import { StoreService } from '../../providers/store.service';
import { ITradeToCategory } from '../../models/trade-to-category.interface';
import { PointService } from '../../providers/point.service';
import { ShiftService } from '../../providers/shift.service';
import { QuoteService } from '../../providers/quote.service';

@Component({
    selector: 'quote-add',
    templateUrl: 'quote-add.component.html',
})
export class QuoteAddComponent {
    @ViewChild('selectTax', { static: false }) selectTax: IonSelect;
    @ViewChild('barcodeInput', { static: true }) barcodeInput: IonInput;
    tab = 'payment';
    contactSelected: IContact;
    staffSelected: any;
    pointPaymentConfig: any;
    pointConfigs: any;
    params: any = null;
    discounts = [];
    prices = [];
    quote: any = {items:[], total: 0, netValue: 0, tax: 0, discountOnTotal: 0, shippingFee: 0, discount: 0, discountType: 0, shipCostOnCustomer: true};
    oldQuote: any = null;
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
        private quoteService: QuoteService,
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

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        const code = await this.userService.getAttr('current-currency');
        this.hideTax = await this.userService.getAttr('hide-tax');
        this.currency = Helper.getCurrencyByCode(code);
        const data = await this.quoteService.getNewOrderData();
        this.outStock = await this.userService.getAttr('out-stock');
        this.pointPaymentConfig = this.pointService.getPointPaymentConfigByInput(data.shopConfigs);
        this.pointConfigs = data.pointConfigs;
        this.quote = {items:[], total: 0, netValue: 0, tax: 0, discountOnTotal: 0, shippingFee: 0, discount: 0, discountType: 0, shipCostOnCustomer: true};
        if (this.pointPaymentConfig && this.pointPaymentConfig.pointPaymentExchange) {
            this.quote.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
        }
        this.quote.createdAt = moment(new Date()).format(DateTimeService.getDateTimeDbFormat());
        this.params = this.navCtrl.getParams(this.params);
        const hideNoProduct = await this.storage.get('hide-no-product');
        this.isHideNoProductDescription = hideNoProduct && hideNoProduct === '1';
        let quoteId = 0;
        let contactId = 0;
        let productId = 0;
        this.store = await this.storeService.getCurrentStore();
        this.noPrompt = true;
        if (this.params) {
            if (this.params && this.params.id) {
                quoteId = this.params.id;
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
                this.quote.tableId = this.table.id;
            }
            if (this.params && this.params.convert) {
                this.quote.contactAddress = this.params.convert.contactAddress;
                this.quote.contactName = this.params.convert.contactName;
                this.quote.contactPhone = this.params.convert.contactPhone;
                this.quote.itemsJson = this.params.convert.itemsJson;
                this.quote.items = JSON.parse(this.quote.itemsJson);
                this.quote.total = 0;
                this.quote.netValue = 0;
                this.quote.paid = 0;
                this.quote.change = 0;
                this.quote.discountOnTotal = 0;
                this.quote.tax = 0;
                this.quote.shippingFee = 0;
                if (this.quote.items && this.quote.items.length) {
                    for (const item of this.quote.items) {
                        this.reCalc(item);
                    }
                }
            }
            if (this.params && this.params.quote && this.params.mode === 'copy') {
                const quoteCopied = JSON.parse(JSON.stringify(this.params.quote));
                quoteCopied.id = 0;
                quoteCopied.createdAt = null;
                this.contactSelected = quoteCopied.contact;
                this.staffSelected = quoteCopied.staff;
                this.contactSelected = quoteCopied.contact;
                this.quote = quoteCopied;
            }
        }
        this.prices = data.customerPrices
        this.discounts = data.customerDiscounts;

        if (quoteId && quoteId > 0) {
            const loading = await this.navCtrl.loading();
            this.quoteService.get(quoteId).then(async (quote) => {
                await loading.dismiss();
                this.contactSelected = quote.contact && quote.contact.id !== 0 ? quote.contact : null;
                this.staffSelected = quote.staff && quote.staff.id !== 0
                    ? quote.staff
                    : null;
                this.quote = quote;
                if (this.pointPaymentConfig && this.pointPaymentConfig.pointPaymentExchange) {
                    this.quote.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
                }
                this.table = this.quote.table;
                this.oldQuote = JSON.parse(JSON.stringify(quote));
                this.quote.items = JSON.parse(this.quote.itemsJson);
                this.totalProductAmount = this.quote.items && this.quote.items.length
                    ? _.sumBy(this.quote.items, (item: any) => item.total)
                    : 0;
                setTimeout(() => {
                    this.noPrompt = false;
                }, 2000);
            });
        } else {
            const taxTypeString = await this.storage.get('tax-type');
            this.quote.taxType = taxTypeString ? +taxTypeString : 0;
            if (this.staffService.isStaff()) {
                this.staffSelected = this.staffService.selectedStaff;
            }
            if (contactId && contactId > 0) {
                const contact = await this.contactService.get(contactId);
                this.contactSelected = contact;
                this.quote.contactId = contact.id;
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
                    this.quote.contactId = contact.id;
                } else {
                    this.quote.contactName = this.flow.fromUserName;
                }
            }
            if (this.params && this.params.fbcomment && this.params.fbcomment.fromUserId) {
                const contact = await this.contactService.searchContactByFbUserId(this.params.fbcomment.fromUserId);
                if (contact) {
                    this.contactSelected = contact;
                    this.quote.contactId = contact.id;
                } else {
                    this.quote.contactName = this.params.fbcomment.fromUserName;
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
        if (!this.quote.items || !this.quote.items.length) {
            return;
        }
        for (const input of this.quote.items) {
            let configSelected = null;
            for (const config of this.pointConfigs) {
                if (!config.forAllCustomer) {
                    if (config.contactId != this.quote.contactId) {
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
                if (config.contactId == this.quote.contactId) {
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
        for (const item of this.quote.items) {
            const recalcItem = this.checkDiscount(item);
            if (recalcItem) {
                this.reCalc(item);
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
        for (const item of this.quote.items) {
            const recalcItem = this.checkPrice(item);
            if (recalcItem) {
                this.reCalc(item);
                needRecal = true;
            }
        }
        if (needRecal) {
            this.reCalcTotal();
        }
    }

    calcDiscount(item: any, customerDiscount: any): any {
        if (customerDiscount.type === 0) {
            return customerDiscount.discountValue;
        }
        const discount = item.price * item.count * customerDiscount.discountValue / 100;
        return discount;
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('quote-add');
    }

    async showSearchContact() {
        this.analyticsService.logEvent('quote-add-search-contact');
        const callback = async (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact as IContact;
                this.quote.contactId = contact.id;
                this.quote.contactName = contact ? contact.fullName : null;
                this.quote.contactPhone = contact ? contact.mobile : null;
                this.quote.contactAddress = contact ? contact.address : null;
                this.checkDiscountOnChangeCustomer();
                this.checkPriceOnChangeCustomer();
                this.quote.pointAmount = 0;
                if (this.quote.amountFromPoint) {
                    this.quote.amountFromPoint = 0;
                    this.reCalcTotal();
                }
                this.calculatePoints();
                return;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchStaff() {
        this.analyticsService.logEvent('quote-add-search-staff');
        const callback = async (data) => {
            const staff = data;
            if (staff) {
                this.staffSelected = staff;
                this.quote.collaboratorId = staff.id;
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
        if (!this.quote.name) {
            alert(this.translateService.instant('quote-add.no-name'));
            return false;
        }
        const usePointPayment = this.contactSelected && this.contactSelected.point
            && this.pointPaymentConfig.allowPointPayment && this.pointPaymentConfig.pointPaymentExchange
            && this.contactSelected.buyCount >= this.pointPaymentConfig.pointPaymentAfterBuyCount;
        if (usePointPayment && this.quote.pointAmount && this.quote.pointAmount > this.contactSelected.point) {
            alert(this.translateService.instant('quote-add.poin-amount-limit-alert'));
            return false;
        }
        if (!this.quote.items || !this.quote.items.length) {
            alert(this.translateService.instant('quote-add.no-items-alert'));
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
        for (const item of this.quote.items) {
            // tslint:disable-next-line:no-string-literal
            delete item['quantity'];
        }
        this.quote.itemsJson = JSON.stringify(this.quote.items);
        if (this.staffService.isStaff()) {
            this.quote.staffId = this.staffService.selectedStaff.id;
        }
        const loading = await this.navCtrl.loading();
        if (!this.contactSelected && this.quote && this.quote.contactName && this.quote.contactPhone) {
            this.analyticsService.logEvent('quote-add-new-contact');
            let newContact = null;
            let newContactId = null;
            const contactByPhone = await this.contactService.searchContactByPhone(this.quote.contactPhone);
            if (contactByPhone && confirm(this.translateService.instant('quote-add.contact-phone-duplicated', { name: contactByPhone.fullName, phone: contactByPhone.mobile }))) {
                newContact = contactByPhone;
                newContactId = contactByPhone.id;
            } else {
                newContact = new Contact();
                newContact.fullName = this.quote.contactName;
                newContact.mobile = this.quote.contactPhone;
                newContact.address = this.quote.contactAddress;
                newContact.staffId = this.quote.staffId;
                newContactId = await this.contactService.saveContact(newContact);
            }
            this.contactSelected = newContact;
            this.quote.contactId = newContactId;
        }
        this.quote.storeId = this.store ? this.store.id : 0;
        this.quote.saveProductNotes = true;
        this.quote.lang = await this.userService.getAttr('current-language');
        this.quoteService.save(this.quote).then(async () => {
            this.analyticsService.logEvent('quote-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            Promise.all(arr).then(async () => {
                // Done
                await loading.dismiss();
                this.saveDisabled = false;
                this.exitPage();
            });
        });
    }

    saveLastActive(): Promise<number> {
        const action = 'trade';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactQuote', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadQuoteList');
        this.navCtrl.publish('reloadQuote', this.quote);
        if (this.quote.contact && this.contactSelected) {
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactQuote', this.contactSelected.id);
        }
        if (this.quote.tableId > 0) {
            this.navCtrl.publish('reloadTable', this.table);
            this.navCtrl.publish('reloadTableList');
        }
        if (this.isNew && this.quote.tableId === 0) {
            await this.navCtrl.navigateForward('/quote/detail', { id: this.quote.id });
        }
    }

    removeStaff(): void {
        this.staffSelected = null;
        this.quote.collaboratorId = 0;
        this.quote.staffId = 0;
        this.checkDiscountOnChangeCustomer();
        this.checkPriceOnChangeCustomer();
    }

    removeContact(): void {
        this.contactSelected = null;
        this.quote.contactId = 0;
        this.quote.contactName = null;
        this.quote.contactPhone = null;
        this.quote.contactAddress = null;
        this.checkDiscountOnChangeCustomer();
        this.checkPriceOnChangeCustomer();
        this.quote.pointAmount = 0;
        if (this.quote.amountFromPoint) {
            this.quote.amountFromPoint = 0;
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
        this.analyticsService.logEvent('quote-add-search-product');
        const callback = async (data) => {
            if (!data || !data.length) {
                return;
            }

            for (const item of this.quote.items) {
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
        await this.navCtrl.push('/quote/product-selector', {
            callback,
            contactId: (this.contactSelected ? this.contactSelected.id : null),
            staffId: (this.staffSelected ? this.staffSelected.id : null),
        });
    }

    async addProductFromArr(product: any, tradeToCategories: ITradeToCategory[]): Promise<void> {
        if (!product) {
            return;
        }

        const item: any = {};
        item.price = product.price;
        item.quantity = product.quantity;
        item.discountPercent = product.discountPercent;
        item.discountType = 0;
        item.costPrice = product.costPrice ? product.costPrice : null;
        item.productId = product.id;
        item.isCombo = product.isCombo;
        item.productCode = product.code;
        item.productName = product.title;
        item.productAvatar = product.avatarUrl;
        item.description = product.description;
        item.unit = product.unit;
        item.basicUnit = product.basicUnit;
        item.unitExchange = product.unitExchange;
        item.discount = product.discount ? product.discount : 0;
        item.count = product.count;
        item.isExpand = false;
        item.options = product.options;
        item.attributes = product.attributes;
        item.initPrice = product.initPrice;
        item.types = product.types;
        item.typeAttributes = product.typeAttributes;
        item.shopPrice = product.shopPrice;
        item.typeOptions = product.typeOptions;
        item.items = product.itemsJson ? JSON.parse(product.itemsJson) : [];
        item.materials = product.materials && product.materials.length
            ? product.materials
            : product.materialsJson
                ? JSON.parse(product.materialsJson)
                : product.materials;
        const categories = [];
        if (tradeToCategories && tradeToCategories.length) {
            for (const category of tradeToCategories) {
                if (category.tradeId == item.productId) {
                    categories.push(category);
                }
            }
        }
        item.categories = categories;
        this.checkDiscount(item);
        this.checkPrice(item);
        this.quote.items.unshift(item);
        this.reCalc(item);
        const mess = this.translateService.instant('quote-add.added-product',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    checkPrice(item: any): boolean {
        let price = this.prices.find(dc =>
            dc.product && dc.product.id === item.productId
            && this.contactSelected && dc.contact && dc.contact.id == this.contactSelected.id
        );
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === item.productId
                && this.staffSelected && dc.staff && dc.staff.id == this.staffSelected.id
                && !dc.contact
            );
        }
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === item.productId
                && this.staffSelected && dc.isCollaboratorPrice
                && !dc.contact
                && !dc.staff
            );
        }
        if (!price) {
            price = this.prices.find(dc =>
                dc.product && dc.product.id === item.productId
                && !dc.contact
                && !dc.staff
                && !dc.isCollaboratorPrice
            );
        }
        if (!price) {
            if (item.priceInfo && (
                !this.contactSelected && item.priceInfo.contact
                || !this.staffSelected && item.priceInfo.staff
                || !this.staffSelected && item.priceInfo.isCollaboratorPrice
            )) {
                item.price = item.priceInfo.orginalPrice;
                item.priceInfo = null;
                return true;
            }
            return false;
        }
        price.orginalPrice = item.price;
        item.price = price.price;
        item.priceInfo = price;
        return true;
    }

    checkDiscount(item: any): boolean {
        // find discount of contact
        let discount = this.discounts.find(dc =>
            (
                dc.product && dc.product.id === item.productId
                || dc.category && item.categories && item.categories.find(td => td.categoryId == dc.category.id) != null
            )
            && this.contactSelected && dc.contact && dc.contact.id == this.contactSelected.id
        );
        if (!discount) {
            // find discount of staff
            discount = this.discounts.find(dc =>
                (
                    dc.product && dc.product.id === item.productId
                    || dc.category && item.categories && item.categories.find(td => td.categoryId == dc.category.id) != null
                )
                && this.staffSelected && dc.staff && dc.staff.id == this.staffSelected.id
                && !dc.contact
            );
        }
        if (!discount) {
            // find discount of general collaborator
            discount = this.discounts.find(dc =>
                (
                    dc.product && dc.product.id === item.productId
                    || dc.category && item.categories && item.categories.find(td => td.categoryId == dc.category.id) != null
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
                    dc.product && dc.product.id === item.productId
                    || dc.category && item.categories && item.categories.find(td => td.categoryId == dc.category.id) != null
                )
                && !dc.contact
                && !dc.staff
                && !dc.isCollaboratorPrice
            );
        }
        if (!discount) {
            if (item.discountInfo && (
                !this.contactSelected && item.discountInfo.contact
                || !this.staffSelected && item.discountInfo.staff
                || !this.staffSelected && item.discountInfo.isCollaboratorPrice
            )) {
                item.discount = 0;
                item.discountPercent = 0;
                item.discountInfo = null;
                return true;
            }
            return false;
        }
        if (!discount.conditionQuantity || discount.conditionQuantity && item.count >= discount.conditionQuantity) {
            item.discount = this.calcDiscount(item, discount);
            item.discountPercent = discount.type !== 0 ? discount.discountValue : 0;
            item.discountInfo = discount;
            return true;
        }

        return false;
    }

    async addProduct(product: any): Promise<void> {
        if (product) {
            for (const item of this.quote.items) {
                item.isExpand = false;
            }

            const idx = this.quote.items.findIndex(item =>
                item.productId === product.id
                && (!item.attributes || !item.attributes.length)
                && (!item.options || !item.options.length)
                && (!item.typeOptions || !item.typeOptions.length)
                && (!item.typeAttributes || !item.typeAttributes.length)
            );

            if (idx >= 0) {
                const item = this.quote.items[idx];
                item.isExpand = true;
                item.count = item.count * 1 + 1;
                this.checkDiscount(item);
                this.checkPrice(item);
                this.reCalc(item);
                const mess1 = this.translateService.instant('quote-add.qty-product', { product: item.productName, count: item.count + '' });
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

            const item: any = {};
            item.price = selectedUnit ? selectedUnit.price : product.price;
            // tslint:disable-next-line:no-string-literal
            item.quantity = product['quantity'] ? product['quantity'] : product.count;
            item.discouantType = 0;
            item.costPrice = product.costPrice ? product.costPrice : null;
            item.discountPercent = 0;
            item.productId = product.id;
            item.basicUnit = selectedUnit ? product.unit : null;
            item.unitExchange = selectedUnit ? selectedUnit.exchange : null;
            item.isCombo = product.isCombo;
            item.productCode = product.code;
            item.productName = product.title;
            item.productAvatar = product.avatarUrl;
            item.unit = selectedUnit ? selectedUnit.unit : product.unit;
            item.count = 1;
            item.isExpand = false;
            item.shopPrice = product.shopPrice;
            item.items = product.itemsJson ? JSON.parse(product.itemsJson) : [];
            item.materials = product.materials && product.materials.length
                ? product.materials
                : product.materialsJson
                    ? JSON.parse(product.materialsJson)
                    : product.materials;
            this.tradeToCategories = await this.tradeService.getCategoriesToTrade(item.productId);
            item.categories = this.tradeToCategories;
            this.quote.items.unshift(item);
            this.checkDiscount(item);
            this.checkPrice(item);
            this.reCalc(item);
            const mess = this.translateService.instant('quote-add.added-product',
                { product: Helper.productName(product.code, product.title) });
            this.presentToast(mess);
            const left = product.count - item.count;
            const mess3 = this.translateService.instant('product-selector.quantity-left') + ': ' + left;
            this.presentToast(mess + '. ' + mess3);
            this.barcodeFocus();
        }
    }

    async barcodeChanged(): Promise<void> {
        if (!this.barcode || this.barcode.length < 5) {
            return;
        }
        this.analyticsService.logEvent('quote-add-barcode-entered');
        this.productService.searchByBarcode(this.barcode).then(async (product) => {
            if (!product) {
                return;
            }
            if (this.outStock && product.count <= 0) {
                this.analyticsService.logEvent('product-selector-outstock-alert');
                alert(this.translateService.instant('quote-add.outstock-alert'));
                return;
            }
            this.analyticsService.logEvent('quote-add-barcode-entered-ok');
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

    async removeProduct(item: any): Promise<void> {
        const idx = this.quote.items.findIndex(i => i.productId === item.productId && i.unit === item.unit);
        if (idx >= 0) {
            this.quote.items.splice(idx, 1);
        }
        this.analyticsService.logEvent('quote-add-remove-item');
        this.applyItemTotal();
    }

    getOptionPrices(item: any) {
        return Helper.getOptionPrices(item);
    }

    reCalc(item: any): void {
        let optionValue = 0;
        let optionCostPrice = 0;
        if (item.options && item.options.length) {
            for (const option of item.options) {
                optionValue += option.count * option.price;
                optionCostPrice += option.costPrice ? option.count * option.costPrice : 0;
            }
        }
        const netTotal = item.count * (item.price + optionValue);
        const discount = item.discount
            ? (item.discountType === 0 ? item.discount * 1 : (netTotal * item.discount / 100))
            : 0;
        const total = netTotal - discount;
        item.total = total;
        const totalCostPrice = item.count * ((item.costPrice ? item.costPrice : 0) + optionCostPrice);
        item.totalCostPrice = totalCostPrice ? totalCostPrice : null;
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
        for (const item of this.quote.items) {
            netValue += item.total * 1;
            discount += item.discount * 1;
        }
        this.totalProductAmount = netValue;
        this.quote.discount = discount * 1;
        if (this.discountPercent) {
            this.quote.discountOnTotal = netValue * this.discountPercent / 100;
        }
        this.quote.discount += this.quote.discountOnTotal;
        netValue -= this.quote.discountOnTotal;
        this.quote.netValue = netValue;
        this.taxTypeChanged();
        this.calculatePoints();
    }

    changeDiscountOnTotal() {
        this.applyItemTotal();
    }

    async expand(item: any): Promise<void> {
        const isExpand = !item.isExpand;
        for (const item of this.quote.items) {
            item.isExpand = false;
        }
        item.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('quote-add-expand');
        }
    }

    reCalcTotal(calculateTax = false): void {
        let amountFromPoint = 0;
        if (this.contactSelected && this.contactSelected.point
            && this.pointPaymentConfig && this.pointPaymentConfig.allowPointPayment
            && this.quote.pointAmount
            && this.pointPaymentConfig.pointPaymentExchange
        ) {
            amountFromPoint = this.quote.pointAmount * this.pointPaymentConfig.pointPaymentExchange;
            this.quote.pointPaymentExchange = this.pointPaymentConfig.pointPaymentExchange;
        }
        const total = this.quote.netValue * 1 + this.quote.tax * 1 + (this.quote.shipCostOnCustomer ? this.quote.shippingFee * 1 : 0) - amountFromPoint;
        this.quote.amountFromPoint = amountFromPoint;
        this.quote.total = total >= 0 ? total : 0;
        if (calculateTax) {
            if (this.quote.taxType === 0) {
                this.quote.tax = 0;
            } else {
                this.quote.tax = this.taxTypeToRate() * (this.quote.netValue - this.quote.discountOnTotal);
            }
        }
    }

    reCalcChange(): void {
        const change = +this.quote.paid - +this.quote.total;
        this.quote.change = change > 0 ? change : 0;
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('quote-add-scan-barcode');
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
                this.analyticsService.logEvent('quote-add-outstock-alert');
                alert(this.translateService.instant('quote-add.outstock-alert'));
                return;
            }
            this.analyticsService.logEvent('quote-add-scan-from-' + (isweb ? 'web' : 'mobile') + '-ok');
            this.addProduct(product);
            this.barcodeFocus();
        });
    }

    checkContactBarcodeScaned(barcode) {
        this.contactService.get(+barcode).then(async (contact) => {
            if (!contact) {
                return;
            }
            this.analyticsService.logEvent('quote-add-scan-contact-ok');
            this.contactSelected = contact;
        });
    }

    async increase(item) {
        this.analyticsService.logEvent('quote-add-increase');
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
        this.analyticsService.logEvent('quote-add-decrease');
        item.count--;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        this.reCalc(item);
        this.barcodeFocus();
    }

    async showOptions(item: any) {
        const product: any = {};
        product.price = item.price;
        product.id = item.productId;
        product.code = item.productCode;
        product.title = item.productName;
        product.avatarUrl = item.productAvatar;
        product.unit = item.unit;
        product.count = item.count;
        product.options = item.options;
        product.total = item.total;
        product.attributes = item.attributes;
        this.analyticsService.logEvent('quote-add-show-options');
        const callback = (data) => {
            if (data) {
                item.options = data.options;
                item.attributes = data.attributes;
                this.reCalc(item);
            }
        };
        await this.navCtrl.push('/quote/option-selector', {
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
        if (this.quote.taxType === 0) {
            return 0;
        }
        const taxTypeValue = this.quote.taxType !== 10
            ? this.quote.taxType
            : 0.6;
        return (taxTypeValue - 1) * 0.05 + 0.1;
    }

    async taxTypeChanged(prompt = false) {
        if (!this.noPrompt && prompt) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('quote-add.save-tax-type-alert'),
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: async () => {
                            await this.storage.set('tax-type', this.quote.taxType + '');
                        }
                    },
                    {
                        text: this.translateService.instant('quote-add.save-tax-type-only-one'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.analyticsService.logEvent('quote-add-tax-type-changed');
        }
        if (this.quote.taxType === 0) {
            this.quote.tax = 0;
            this.reCalcTotal();
            return;
        }
        this.quote.tax = this.taxTypeToRate() * this.quote.netValue;
        this.reCalcTotal();
    }

    openTaxType() {
        this.analyticsService.logEvent('quote-add-tax-type-open');
        this.selectTax.open();
    }

    async openProductDiscountPercent(item: any) {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('quote-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('quote-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: item.discountPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('quote-add.remove-percent'),
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
                            alert(this.translateService.instant('quote-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('quote-add-change-discount-percent');
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
            message: this.translateService.instant('quote-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('quote-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('quote-add.remove-percent'),
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
                            alert(this.translateService.instant('quote-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('quote-add-change-discount-percent');
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

    async showTypes(item: any) {
        this.analyticsService.logEvent('quote-add-show-types');
        const product: any = {};
        product.price = item.price;
        product.id = item.productId;
        product.code = item.productCode;
        product.title = item.productName;
        product.avatarUrl = item.productAvatar;
        product.unit = item.unit;
        product.count = item.count;
        product.options = item.options;
        product.total = item.total;
        product.types = item.types;
        product.typeOptions = item.typeOptions;
        product.typeAttributes = item.typeAttributes;
        product.initPrice = item.initPrice;
        const callback = (data) => {
            if (data) {
                item.types = data.types;
                item.typeOptions = this.getTypeOptions(data.types);
                item.typeAttributes = this.getTypeAttributesString(item);
                item.initPrice = data.initPrice;
                item.price = data.price ? data.price : item.initPrice;
                this.reCalc(item);
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
        if (!this.quote.contactPhone) {
            return;
        }
        const contact = await this.contactService.searchContactByPhone(this.quote.contactPhone);
        if (contact) {
            const mess = this.translateService.instant('quote-add.found-phone', { contact: contact.fullName, mobile: contact.mobile });
            if (confirm(mess)) {
                this.contactSelected = contact;
                this.quote.contactId = contact.id;
                this.quote.contactName = contact ? contact.fullName : null;
                this.quote.contactPhone = contact ? contact.mobile : null;
                this.quote.contactAddress = contact ? contact.address : null;
            }
        }
    }

    spendAll() {
        if (!this.contactSelected || !this.contactSelected.point) {
            return;
        }
        this.quote.pointAmount = this.contactSelected.point;
    }

    clearAll() {
        this.quote.pointAmount = null;
    }

    changeUsePointPayment() {
        this.quote.amountFromPoint = 0;
        this.quote.pointPaymentExchange = 0;
        this.quote.pointAmount = 0;
        this.reCalcTotal();
    }

    async scanContact() {
        this.analyticsService.logEvent('quote-add-scan-contact-barcode');
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
}
