import { Component, ViewChild } from '@angular/core';
import { IContact } from '../../../models/contact.interface';
import { IMoneyAccount } from '../../../models/money-account.interface';
import { IReceivedNote } from '../../../models/received-note.interface';
import { ReceivedNote } from '../../../models/received-note.model';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { IProduct } from '../../../models/product.interface';
import * as moment from 'moment';
import { ReceivedNoteItem } from '../../../models/received-note-item.model';
import { IReceivedNoteItem } from '../../../models/received-note-item.interface';
import { Debt } from '../../../models/debt.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ModalController, ToastController, AlertController, IonInput } from '@ionic/angular';
import { ContactService } from '../../../providers/contact.service';
import { ProductService } from '../../../providers/product.service';
import { StaffService } from '../../../providers/staff.service';
import { MoneyAccountService } from '../../../providers/money-account.service';
import { ReceivedNoteService } from '../../../providers/received-note.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../providers/user.service';
import { DebtService } from '../../../providers/debt.service';
import { Helper } from '../../../providers/helper.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { ReceivedNoteProductEditComponent } from './received-note-product-edit.component';
import { AnalyticsService } from '../../../providers/analytics.service';
import { BarcodeInputComponent } from '../../shared/barcode-input.component';
import { Product } from '../../../models/product.model';
import { StoreService } from '../../../providers/store.service';

@Component({
    selector: 'received-note-add',
    templateUrl: 'received-note-add.component.html',
})
export class ReceivedNoteAddComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput: IonInput;
    params = null;
    taxPercent = 0;
    discountOnTotalPercent = 0;
    totalProductAmount = 0;
    contactSelected: IContact;
    moneyAccountSelected: IMoneyAccount;
    note: IReceivedNote = new ReceivedNote();
    oldNote: IReceivedNote = null;
    currency: any = { code: 'vnd' };
    isNew = true;
    oldBarcode = '';
    barcode = '';
    saveDisabled = false;
    store: any;

    constructor(
        public navCtrl: RouteHelperService,
        private barcodeScanner: BarcodeScanner,
        private modalCtrl: ModalController,
        private contactService: ContactService,
        private productService: ProductService,
        public staffService: StaffService,
        private moneyAccountService: MoneyAccountService,
        private receivedNoteService: ReceivedNoteService,
        public translateService: TranslateService,
        private userService: UserService,
        private debtService: DebtService,
        private toastCtrl: ToastController,
        private storeService: StoreService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService
    ) {
    }

    onKeyPress = (event: any) => {
        if (!event.target || event.target.localName !== 'body') {
            return;
        }
        if (event.key === 's' || event.key === 'S') {
            this.save();
        }
    };

    ionViewDidEnter() {
        this.navCtrl.addEventListener('keyup', this.onKeyPress);
    }

    ionViewWillLeave() {
        this.navCtrl.removeEventListener('keyup', this.onKeyPress);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('received-note-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {

        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });
        this.note = new ReceivedNote();
        this.note.createdAt = moment(new Date()).format(DateTimeService.getDateTimeDbFormat());
        this.store = await this.storeService.getCurrentStore();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        let noteId = 0;
        let contactId = 0;
        let productId = 0;
        if (data) {
            if (data && data.id) {
                noteId = data.id;
                this.isNew = false;
            } else if (data && data.contact) {
                contactId = +data.contact;
            } else if (data && data.product) {
                productId = +data.product;
            }
        }

        if (noteId && noteId > 0) {
            const loading = await this.navCtrl.loading();
            this.receivedNoteService.get(noteId).then(async (note) => {
                await loading.dismiss();
                this.contactSelected = note.contact && note.contact.id !== 0 ? note.contact : null;
                this.moneyAccountSelected = note.moneyAccount && note.moneyAccount.id !== 0 ? note.moneyAccount : null;
                if (!this.moneyAccountSelected && !this.staffService.isStaff()) {
                    if (this.store && this.store.moneyAccount) {
                        this.moneyAccountSelected = this.store.moneyAccount;
                        this.note.moneyAccountId = this.moneyAccountSelected.id;
                    } else {
                        const account = await this.moneyAccountService.getDefault();
                        if (account) {
                            this.moneyAccountSelected = account;
                            this.note.moneyAccountId = account.id;
                        }
                    }
                }
                this.note = note;
                this.oldNote = JSON.parse(JSON.stringify(note));
                this.note.items = JSON.parse(this.note.itemsJson);
                this.getProductsAmount();
            });
        } else {
            if (!this.staffService.isStaff()) {
                if (this.store && this.store.moneyAccount) {
                    this.moneyAccountSelected = this.store.moneyAccount;
                    this.note.moneyAccountId = this.moneyAccountSelected.id;
                } else {
                    const account = await this.moneyAccountService.getDefault();
                    if (account) {
                        this.moneyAccountSelected = account;
                        this.note.moneyAccountId = account.id;
                    }
                }
                this.barcodeFocus();
            }
            if (contactId && contactId > 0) {
                this.contactService.get(contactId).then((contact: IContact) => {
                    this.contactSelected = contact;
                    this.note.contactId = contact.id;
                });
            } else if (productId && productId > 0) {
                this.productService.get(productId, this.store ? this.store.id : 0).then((product: IProduct) => {
                    this.addProduct(product);
                });
            }
        }
        this.barcodeFocus();
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.note.contactId = contact.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    ionViewLoaded() {
        this.barcodeFocus();
    }

    barcodeFocus(): void {
        setTimeout(() => {
            if (this.barcodeInput) {
                this.barcodeInput.setFocus();
            }
        }, 500);
    }

    validate(): boolean {
        if (!this.note.items || !this.note.items.length) {
            alert(this.translateService.instant('received-note-add.no-items-alert'));
            return false;
        }
        return true;
    }

    async save(): Promise<void> {
        if (!this.validate()) {
            return;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        if (this.staffService.isStaff()) {
            this.note.staffId = this.staffService.selectedStaff.id;
        }
        await this.addProducts();
        this.note.itemsJson = JSON.stringify(this.note.items);
        this.note.storeId = this.store
            ? this.store.id
            : this.note.storeId;
        this.note.saveProductNotes = true;
        this.note.lang = await this.userService.getAttr('current-language');
        this.receivedNoteService.save(this.note).then(async () => {
            this.analyticsService.logEvent('received-note-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            Promise.all(arr).then(async () => {
                await loading.dismiss();
                if (this.note.paid !== null && this.note.paid < this.note.total) {
                    this.confirmToCreateDebt();
                } else {
                    this.exitPage();
                }
            });
        });
    }

    async confirmToCreateDebt(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('received-note-add.paid-is-smaller-than-total-warning'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const debt = new Debt();
                        debt.receivedNoteId = this.note.id;
                        debt.value = this.note.total - this.note.paid;
                        debt.note = this.translateService.instant('received-note-add.paid-is-smaller-note');
                        debt.contactId = this.note.contactId;
                        debt.debtType = 2;
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
            return result;
        });
    }

    async showSearchMoneyAccount() {
        const callback = (data) => {
            const moneyAccount = data;
            if (moneyAccount) {
                this.moneyAccountSelected = moneyAccount;
                this.note.moneyAccountId = moneyAccount.id;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadReceivedNoteList');
        this.navCtrl.publish('reloadReceivedNote', this.note);
        if (this.isNew) {
            await this.navCtrl.push('/received-note/detail', { id: this.note.id });
        }
    }

    removeContact(): void {
        this.contactSelected = null;
        this.note.contactId = 0;
    }

    showDatePopup(): void {
        this.note.createdAt = moment().format(DateTimeService.getDateDbFormat());
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

    async showSearchProduct() {
        const callback = async (data) => {
            if (!data || !data.length) {
                return;
            }

            for (const item of this.note.items) {
                item.isExpand = false;
            }
            for (const product of data) {
                await this.addProductFromArr(product);
            }
        };
    this.navCtrl.push('/received-note/note-product-selector', { callback });
    }

    async addProductFromArr(product: any): Promise<void> {
        if (!product) {
            return;
        }

        const orderItem = new ReceivedNoteItem();
        orderItem.unitPrice = product.price ? product.price : product.costPrice;
        orderItem.costPrice = product.costPrice ? product.costPrice : product.price;
        orderItem.productId = product.id;
        orderItem.productCode = product.code;
        orderItem.productName = product.title;
        orderItem.note = product.note;
        orderItem.unitPriceForeign = product.unitPriceForeign;
        orderItem.amountForeign = product.amountForeign;
        orderItem.unit = product.unit;
        orderItem.unitExchange = product.unitExchange;
        orderItem.basicUnit = product.basicUnit;
        orderItem.discount = product.discount ? product.discount : 0;
        orderItem.discountPercent = product.discountPercent ? product.discountPercent : 0;
        orderItem.discountType = product.discountType ? product.discountType : 0;
        orderItem.quantity = product.quantity;
        orderItem.isExpand = false;
        this.note.items.unshift(orderItem);
        this.reCalc(orderItem);
        const mess = this.translateService.instant('receive-note-add.added-product',
            { product: Helper.productName(product.code, product.title) });
        this.presentToast(mess);
    }

    async addProduct(product: IProduct): Promise<void> {
        if (product) {
            for (const noteItem of this.note.items) {
                noteItem.isExpand = false;
            }

            const idx = this.note.items.findIndex(noteItem => noteItem.productId === product.id
                && (!product.fromUnit || noteItem.unit === product.fromUnit));
            if (idx >= 0) {
                const itemFound = this.note.items[idx];
                itemFound.isExpand = true;
                itemFound.quantity = itemFound.quantity * 1 + 1;
                this.reCalc(itemFound);
                const messFound = this.translateService.instant('order-add.qty-product',
                    { product: itemFound.productName, count: itemFound.quantity + '' });
                this.presentToast(messFound);
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

            const item = new ReceivedNoteItem();
            const price = product.price ? product.price : product.costPrice;
            item.unitPrice = selectedUnit ? selectedUnit.price : price;
            const costPrice = product.costPrice ? product.costPrice : product.price;
            item.costPrice = selectedUnit ? null : costPrice;
            item.productId = product.id;
            item.productName = product.title;
            item.barcode = product.barcode;
            item.discount = 0;
            item.productCode = product.code ? product.code.toUpperCase() : '';
            item.unit = selectedUnit ? selectedUnit.unit : product.unit;
            item.basicUnit = selectedUnit ? product.unit : null;
            item.unitExchange = selectedUnit ? selectedUnit.exchange : null;
            item.quantity = 1;
            item.isExpand = false;

            const modal = await this.modalCtrl.create({
                component: ReceivedNoteProductEditComponent,
                componentProps: { product: item, currency: this.currency, foreignCurrency: this.note.foreignCurrency }
            });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (!data) {
                return;
            }

            this.note.items.unshift(item);
            this.reCalc(item);
            const mess = this.translateService.instant('received-note-add.added-product', { product: item.productName });
            this.presentToast(mess);
            this.barcodeFocus();
        }
    }

    async addNewProduct(barcode: string): Promise<void> {

        const product: IProduct = new Product();
        product.barcode = barcode;

        for (const noteItem of this.note.items) {
            noteItem.isExpand = false;
        }

        const idx = this.note.items.findIndex(noteItem => noteItem.barcode === product.barcode);
        if (idx >= 0) {
            const itemFound = this.note.items[idx];
            itemFound.isExpand = true;
            itemFound.quantity = itemFound.quantity * 1 + 1;
            this.reCalc(itemFound);
            const messFound = this.translateService.instant('order-add.qty-product',
                { product: itemFound.productName, count: itemFound.quantity + '' });
            this.presentToast(messFound);
            return;
        }

        const item = new ReceivedNoteItem();
        item.costPrice = product.costPrice ? product.costPrice : product.price;
        item.unitPrice = product.price;
        item.productId = product.id;
        item.discount = 0;
        item.productName = product.title;
        item.barcode = product.barcode;
        item.productCode = product.code ? product.code.toUpperCase() : '';
        item.unit = product.unit;
        item.quantity = 1;
        item.isExpand = false;

        const modal = await this.modalCtrl.create({
            component: ReceivedNoteProductEditComponent,
            componentProps: { product: item, currency: this.currency, foreignCurrency: this.note.foreignCurrency }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (!data) {
            return;
        }

        this.note.items.unshift(item);
        this.reCalc(item);
        const mess = this.translateService.instant('received-note-add.added-product', { product: item.productName });
        this.presentToast(mess);
        this.barcodeFocus();
    }

    barcodeChanged(): void {
        if (!this.barcode || this.barcode.length < 5) {
            this.oldBarcode = this.barcode;
            return;
        }
        let isBarcodeInput = false;
        if (!this.oldBarcode && this.barcode) {
            isBarcodeInput = true;
        }
        const barcodeInput = this.barcode;
        this.oldBarcode = barcodeInput;
        if (isBarcodeInput) {
            setTimeout(() => {
                this.barcode = '';
                this.oldBarcode = '';
            }, 200);
        }
        this.productService.searchByBarcode(barcodeInput).then((product) => {
            if (!product) {
                if (isBarcodeInput) {
                    this.barcode = '';
                    this.oldBarcode = '';
                    this.addNewProduct(barcodeInput);
                    this.barcodeFocus();
                }
                return;
            }
            this.addProduct(product);
            this.barcode = '';
            this.oldBarcode = '';
            this.barcodeFocus();
        });
    }

    async presentToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3000,
            position: 'bottom'
        });
        await toast.present();
    }

    removeProduct(item2Remove: IReceivedNoteItem): void {
        const idx = this.note.items.findIndex(item => item.productId === item2Remove.productId && item.unit === item2Remove.unit);
        if (idx >= 0) {
            this.note.items.splice(idx, 1);
        }
        this.applyItemTotal();
    }

    reCalc(item: IReceivedNoteItem): void {
        const netTotal = item.quantity * item.costPrice;
        const discount = item.discountType === 0
            ? (item.discountPercent === 0
                ? item.discount * 1
                : netTotal * item.discountPercent / 100
            )
            : (netTotal * item.discount / 100);
        item.discount = discount;
        item.amount = netTotal - discount;
        if (item.unitPriceForeign && item.quantity) {
            item.amountForeign = item.quantity * item.unitPriceForeign;
        }
        this.applyItemTotal();
    }

    getProductsAmount() {
        let netValue = 0;
        for (const item of this.note.items) {
            netValue += item.amount * 1;
        }
        this.totalProductAmount = netValue;
    }

    applyItemTotal(): void {
        let netValue = 0;
        let netValueForeign = 0;
        for (const item of this.note.items) {
            netValue += item.amount * 1;
            netValueForeign += item.amountForeign ? item.amountForeign * 1 : 0;
        }

        this.totalProductAmount = netValue;

        if (this.discountOnTotalPercent) {
            this.note.discountOnTotal = netValue * this.discountOnTotalPercent / 100;
        }
        this.note.discount += this.note.discountOnTotal;
        netValue -= this.note.discountOnTotal;

        if (this.taxPercent) {
            this.note.tax = netValue * this.taxPercent / 100;
        }

        this.note.netValue = netValue * 1;
        this.note.totalForeign = netValueForeign * 1;
        this.reCalcTotal();
    }

    expand(orderItem: IReceivedNoteItem): void {
        const isExpand = !orderItem.isExpand;
        for (const item of this.note.items) {
            item.isExpand = false;
        }
        orderItem.isExpand = isExpand;
    }

    reCalcTotal(): void {
        this.note.total = this.note.netValue * 1 + this.note.tax * 1 + this.note.shippingFee * 1;
        this.note.paid = this.note.total;
    }

    async scan(): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.productService.searchByBarcode(data.barcode).then((product: IProduct) => {
                    if (!product) {
                        this.addNewProduct(data.barcode);
                        return;
                    }
                    this.addProduct(product);
                });
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.productService.searchByBarcode(barcodeData.text).then((product: IProduct) => {
                if (!product) {
                    this.addNewProduct(barcodeData.text);
                    return;
                }
                this.addProduct(product);
            });
        });
    }

    removeMoneyAccount(): void {
        this.moneyAccountSelected = null;
        this.note.moneyAccountId = 0;
    }

    async addProducts() {
        for (const noteItem of this.note.items) {
            if (!noteItem.productId) {
                const product = new Product();
                product.code = noteItem.productCode;
                product.title = noteItem.productName;
                product.count = 0;
                product.foreignCurrency = noteItem.foreignCurrency;
                product.costPrice = noteItem.costPrice;
                product.price = noteItem.unitPrice ? noteItem.unitPrice : noteItem.costPrice;
                product.unit = noteItem.unit;
                product.costPriceForeign = noteItem.unitPriceForeign;
                product.originalPrice = product.price;
                product.barcode = noteItem.barcode;
                const id = await this.productService.saveProduct(product);
                noteItem.productId = id;
            }
        }
    }

    increase(item) {
        item.quantity++;
        this.reCalc(item);
    }

    decrease(item) {
        item.quantity--;
        this.reCalc(item);
    }

    async openProductDiscountPercent(item: IReceivedNoteItem) {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('received-note-add.discount-percent-message'),
            inputs: [
                {
                    name: 'discountPercent',
                    placeholder: this.translateService.instant('received-note-add.enter-discount-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: item.discountPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('received-note-add.remove-percent'),
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
                            alert(this.translateService.instant('received-note-add.discount-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('received-note-add-change-discount-percent');
                        if (percent) {
                            item.discountPercent = percent;
                            // item.discount = (item.costPrice * item.quantity) * percent / 100;
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

    async openTaxPercent() {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('received-note-add.tax-percent-message'),
            inputs: [
                {
                    name: 'taxPercent',
                    placeholder: this.translateService.instant('received-note-add.enter-tax-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: this.taxPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('received-note-add.remove-percent'),
                    handler: () => {
                        this.taxPercent = 0;
                        this.applyItemTotal();
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async (inputs: any) => {
                        if (!inputs) {
                            return;
                        }
                        const percent = +inputs.taxPercent;
                        if (percent < 0 || percent > 100) {
                            alert(this.translateService.instant('received-note-add.tax-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('received-note-add-change-tax-percent');
                        if (percent) {
                            this.taxPercent = percent;
                            this.applyItemTotal();
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

    async openDiscountOnTotalPercent() {
        const discountDialog = await this.alertCtrl.create({
            message: this.translateService.instant('received-note-add.discount-on-total-percent-message'),
            inputs: [
                {
                    name: 'discountOnTotalPercent',
                    placeholder: this.translateService.instant('received-note-add.enter-discount-on-total-percent'),
                    type: 'number',
                    min: 0,
                    max: 100,
                    value: this.discountOnTotalPercent
                }
            ],
            buttons: [
                {
                    text: this.translateService.instant('received-note-add.remove-percent'),
                    handler: () => {
                        this.discountOnTotalPercent = 0;
                        this.applyItemTotal();
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async (inputs: any) => {
                        if (!inputs) {
                            return;
                        }
                        const percent = +inputs.discountOnTotalPercent;
                        if (percent < 0 || percent > 100) {
                            alert(this.translateService.instant('received-note-add.discount-on-total-percent-not-valid'));
                            return;
                        }
                        this.analyticsService.logEvent('received-note-add-change-discount-on-total-percent');
                        if (percent) {
                            this.discountOnTotalPercent = percent;
                            this.applyItemTotal();
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

    changeDiscountOnTotal() {
        this.applyItemTotal();
    }
}
