// tslint:disable:triple-equals
// tslint:disable:use-lifecycle-interface
import { Component, ViewChild } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { IProduct } from '../../../models/product.interface';
import * as moment from 'moment';
import { ProductNoteItem } from '../../../models/product-note.model';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { Platform, ModalController, ToastController, IonInput } from '@ionic/angular';
import { ProductService } from '../../../providers/product.service';
import { StaffService } from '../../../providers/staff.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../../providers/user.service';
import { Helper } from '../../../providers/helper.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { BarcodeInputComponent } from '../../shared/barcode-input.component';
import { StoreService } from '../../../providers/store.service';
import { TransferNoteProductEditComponent } from './transfer-note-product-edit.component';
import { TransferNoteService } from '../../../providers/transfer-note.service';
import { ITransferNoteItem } from '../../../models/transfer-note-item.interface';
import { TransferNoteItem } from '../../../models/transfer-note-item.model';
import { DataService } from '../../../providers/data.service';
import { MoneyAccountService } from '../../../providers/money-account.service';
import { TradeService } from '../../../providers/trade.service';
import { Trade } from '../../../models/trade.model';

@Component({
    selector: 'transfer-note-add',
    templateUrl: 'transfer-note-add.component.html',
})
export class TransferNoteAddComponent {
    @ViewChild('barcodeInput', { static: true }) barcodeInput: IonInput;
    params = null;
    note: any = { items: [] };
    oldNote: any = null;
    currency: any = { code: 'vnd' };
    isNew = true;
    oldBarcode = '';
    barcode = '';
    saveDisabled = false;
    store: any;
    importStore: any;
    exportStore: any;
    isMobile = true;
    stores = [];
    mainStore;
    exportMoneyAccount;
    importMoneyAccount;
    mainShopMoneyAccount;
    isMainStoreForExport;
    isMainStoreForImport;

    constructor(
        public navCtrl: RouteHelperService,
        private barcodeScanner: BarcodeScanner,
        private platform: Platform,
        private modalCtrl: ModalController,
        private productService: ProductService,
        public staffService: StaffService,
        private transferNoteService: TransferNoteService,
        public translateService: TranslateService,
        private userService: UserService,
        private toastCtrl: ToastController,
        private storeService: StoreService,
        private analyticsService: AnalyticsService,
        private moneyAccountService: MoneyAccountService,
        private tradeService: TradeService,
        private dataService: DataService
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
        await this.analyticsService.setCurrentScreen('transfer-note-add');
    }

    async ngOnInit(): Promise<void> {
        this.stores = await this.storeService.getStores();
        this.mainStore = await this.dataService.getFirstObject('shop');
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });
        this.isMobile = this.platform.width() < 720;
        this.note = { items: [], code: moment().format('YYMMDD-HHmmss') };
        this.note.createdAt = moment().format(DateTimeService.getDateTimeDbFormat());
        this.store = await this.storeService.getCurrentStore();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        let noteId = 0;
        let productId = 0;
        if (data) {
            if (data && data.id) {
                noteId = data.id;
                this.isNew = false;
            } else if (data && data.product) {
                productId = +data.product;
            }
        }

        if (noteId && noteId > 0) {
            const loading = await this.navCtrl.loading();
            this.transferNoteService.get(noteId).then(async (note) => {
                await loading.dismiss();
                this.note = note;
                this.mainStore.isMainShop = true;
                this.exportStore = this.note.exportStoreId && this.stores && this.stores.length
                    ? this.stores.find(s => s.id == this.note.exportStoreId)
                    : this.mainStore;
                this.importStore = this.note.importStoreId && this.stores && this.stores.length
                    ? this.stores.find(s => s.id == this.note.importStoreId)
                    : this.mainStore;
                this.oldNote = JSON.parse(JSON.stringify(note));
                this.note.items = JSON.parse(this.note.itemsJson);
            });
        } else if (productId && productId > 0) {
            this.productService.get(productId, this.store ? this.store.id : 0).then((product: IProduct) => {
                this.addProduct(product);
            });
        }
        this.barcodeFocus();
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
        if (!this.exportStore || !this.importStore) {
            alert(this.translateService.instant('transfer-note-add.must-select-stores'));
            return false;
        }
        if (this.note.exportStoreId === this.note.importStoreId) {
            alert(this.translateService.instant('transfer-note-add.stores-must-different'));
            return false;
        }
        if (this.note.hasPayment && (!this.exportMoneyAccount || !this.importMoneyAccount)) {
            alert(this.translateService.instant('transfer-note-add.has-payment-but-missing-money-accounts'));
            return false;
        }
        if (!this.note.items || !this.note.items.length) {
            alert(this.translateService.instant('transfer-note-add.no-items-alert'));
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
        this.note.itemsJson = JSON.stringify(this.note.items);
        this.note.exportStoreId = this.exportStore && !this.isMainStoreForExport
            ? this.exportStore.id
            : 0;
        this.note.importStoreId = this.importStore && !this.isMainStoreForImport
            ? this.importStore.id
            : 0;
        if (!this.note.hasPayment) {
            this.note.total = 0;
        }
        this.transferNoteService.save(this.note).then(async () => {
            this.analyticsService.logEvent('transfer-note-add-save-success');
            const arr: Promise<any>[] = [];
            Promise.all(arr).then(async () => {
                await this.createTransactionsForExport();
                await this.createTransactionsForImport();
                await this.addProductNotes();
                await loading.dismiss();
                this.exitPage();
            });
        });
    }

    async createTransactionsForImport(): Promise<void> {
        if (!this.note.id) {
            return;
        }

        let staffId = 0;
        if (this.staffService.isStaff()) {
            staffId = this.staffService.selectedStaff.id;
        }
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByTransferNote(this.note.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const trade = new Trade();
        trade.contactId = this.note.contactId;
        trade.staffId = staffId;
        trade.isPurchase = false;
        trade.isReceived = false;
        trade.value = this.note.total;
        trade.transferNoteId = this.note.id;
        trade.moneyAccountId = this.note.importMoneyAccountId;
        trade.note = this.translateService.instant('transfer-note-add.transfer-note') + ' #' + this.note.id;
        trade.createdAt = this.note.createdAt;
        arr.push(this.tradeService.saveTrade(trade));

        await Promise.all(arr);
    }

    async createTransactionsForExport(): Promise<void> {
        if (!this.note.id) {
            return;
        }

        let staffId = 0;
        if (this.staffService.isStaff()) {
            staffId = this.staffService.selectedStaff.id;
        }
        const arr = [];
        const tradesToDelete = await this.tradeService.getTradesByTransferNote(this.note.id);
        for (const item of tradesToDelete) {
            if (!item.debtId) {
                arr.push(this.tradeService.deleteTrade(item));
            }
        }
        const trade = new Trade();
        trade.contactId = this.note.contactId;
        trade.staffId = staffId;
        trade.isPurchase = false;
        trade.isReceived = true;
        trade.value = this.note.total;
        trade.transferNoteId = this.note.id;
        trade.moneyAccountId = this.note.exportMoneyAccountId;
        trade.note = this.translateService.instant('transfer-note-add.transfer-note') + ' #' + this.note.id;
        trade.createdAt = this.note.createdAt;
        arr.push(this.tradeService.saveTrade(trade));

        await Promise.all(arr);
    }

    hasPaymentChanged() {
        if (this.exportStore) {
            this.exportMoneyAccount = this.exportStore.moneyAccount;
        }
        if (this.importStore) {
            this.importMoneyAccount = this.importStore.moneyAccount;
        }
    }

    async showSearchExportMoneyAccount() {
        const callback = (data) => {
            const moneyAccount = data;
            if (moneyAccount) {
                this.exportMoneyAccount = moneyAccount;
                this.note.exportMoneyAccountId = moneyAccount.id;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    async showSearchImportMoneyAccount() {
        const callback = (data) => {
            const moneyAccount = data;
            if (moneyAccount) {
                this.importMoneyAccount = moneyAccount;
                this.note.importMoneyAccountId = moneyAccount.id;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    removeExportMoneyAccount(): void {
        this.exportMoneyAccount = null;
        this.note.exportMoneyAccountId = 0;
    }

    removeImportMoneyAccount(): void {
        this.importMoneyAccount = null;
        this.note.importMoneyAccountId = 0;
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadTransferNoteList');
        this.navCtrl.publish('reloadTransferNote', this.note);
        if (this.isNew) {
            await this.navCtrl.push('/transfer-note/detail', { id: this.note.id });
        }
    }

    showDatePopup(): void {
        this.note.createdAt = moment().format('YYYY-MM-DD');
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    removeDate(): void {
        this.note.createdAt = '';
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    async showSearchProduct() {
        if (!this.exportStore) {
            alert(this.translateService.instant('transfer-note-add.select-export-store-first'));
            return;
        }
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
        this.navCtrl.push('/transfer-note/transfer-product-selector', { callback, exportStore: this.exportStore });
    }

    async addProductFromArr(product: any): Promise<void> {
        if (!product) {
            return;
        }

        const orderItem = new TransferNoteItem();
        orderItem.unitPrice = product.unitPrice;
        orderItem.productId = product.id;
        orderItem.productCode = product.code;
        orderItem.productName = product.title;
        orderItem.note = product.note;
        orderItem.unit = product.unit;
        orderItem.unitExchange = product.unitExchange;
        orderItem.basicUnit = product.basicUnit;
        orderItem.actualExport = product.actualExport;
        orderItem.actualImport = product.actualImport;
        orderItem.isExpand = false;
        this.note.items.unshift(orderItem);
        this.reCalc(orderItem);
        const mess = this.translateService.instant('transfer-note-add.added-product',
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

            const item: ITransferNoteItem = new TransferNoteItem();
            const price = product.price ? product.price : product.costPrice;
            item.unitPrice = selectedUnit ? selectedUnit.price : price;
            item.productId = product.id;
            item.productName = product.title;
            item.productCode = product.code ? product.code.toUpperCase() : '';
            item.unit = selectedUnit ? selectedUnit.unit : product.unit;
            item.basicUnit = selectedUnit ? product.unit : null;
            item.unitExchange = selectedUnit ? selectedUnit.exchange : null;
            item.actualExport = 1;
            item.actualImport = 1;
            item.isExpand = false;

            const modal = await this.modalCtrl.create({
                component: TransferNoteProductEditComponent,
                componentProps: { product: item, currency: this.currency, foreignCurrency: this.note.foreignCurrency }
            });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (!data) {
                return;
            }

            this.note.items.unshift(item);
            this.reCalc(item);
            const mess = this.translateService.instant('transfer-note-add.added-product', { product: item.productName });
            this.presentToast(mess);
            this.barcodeFocus();
        }
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
            position: 'top'
        });
        await toast.present();
    }

    removeProduct(item2Remove: any): void {
        const idx = this.note.items.findIndex(noteItem => noteItem.productId == item2Remove.productId);
        if (idx >= 0) {
            this.note.items.splice(idx, 1);
        }
        this.applyItemTotal();
    }

    reCalc(item: ITransferNoteItem): void {
        const netTotal = item.actualImport * item.unitPrice;
        const discount = item.discountType == 0 ? item.discount * 1 : (netTotal * item.discount / 100);
        item.amount = netTotal - discount;
        this.applyItemTotal();
    }

    applyItemTotal(): void {
        let netValue = 0;
        for (const item of this.note.items) {
            netValue += item.amount * 1;
        }
        this.note.total = netValue * 1;
        this.reCalcTotal();
    }

    expand(orderItem: ITransferNoteItem): void {
        const isExpand = !orderItem.isExpand;
        for (const item of this.note.items) {
            item.isExpand = false;
        }
        orderItem.isExpand = isExpand;
    }

    reCalcTotal(): void {
        // this.note.total = this.note.netValue * 1;
    }

    async scan(): Promise<void> {
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.productService.searchByBarcode(data.barcode).then((product: IProduct) => {
                    if (!product) {
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
                    return;
                }
                this.addProduct(product);
            });
        });
    }

    async addProductNotes(): Promise<void> {

        if (!this.note.id) {
            return;
        }

        const productNotesToDelete = await this.productService.getNotesByTransferNote(this.note.id);
        for (const item of productNotesToDelete) {
            await this.productService.deleteProductNote(item);
        }
        for (const item of this.note.items) {
            const productExportNote = this.buildProductNote(
                this.exportStore && !this.exportStore.isMainShop ? this.exportStore.id : 0, item, -item.actualExport, true);
            const productImportNote = this.buildProductNote(
                this.importStore && !this.importStore.isMainShop ? this.importStore.id : 0, item, +item.actualImport, false);
            await this.productService.saveProductNote(productExportNote);
            await this.productService.saveProductNote(productImportNote);
        }
    }

    buildProductNote(storeId, item: any, quantity: number, isExport): ProductNoteItem {
        const productNote = new ProductNoteItem();
        productNote.transferNoteId = this.note.id;
        productNote.storeId = storeId;
        productNote.amount = this.note.hasPayment ? (isExport ? 1 : -1) * item.amount : 0;
        productNote.unitPrice = item.costPrice ? item.costPrice : item.unitPrice;
        productNote.unit = item.unit;
        productNote.basicUnit = item.basicUnit;
        productNote.unitExchange = item.unitExchange;
        productNote.quantity = quantity;
        productNote.productId = item.productId;
        productNote.productName = item.productName;
        productNote.productCode = item.productCode;
        productNote.staffId = this.staffService.isStaff() ? this.staffService.selectedStaff.id : 0;
        productNote.note = item.note
            ? item.note
            : this.translateService.instant('transfer-note-add.transfer-note') + ' #' + this.note.id;
        return productNote;
    }

    increase(item: ITransferNoteItem) {
        item.actualExport++;
        item.actualImport++;
        this.reCalc(item);
    }

    decrease(item: ITransferNoteItem) {
        if (item.actualExport > 0) {
            item.actualExport--;
        }
        if (item.actualImport > 0) {
            item.actualImport--;
        }
        this.reCalc(item);
    }

    async showSearchExportStore() {
        const callback = async (data) => {
            const store = data;
            if (store) {
                this.exportStore = store;
                this.note.exportStoreId = !store.isMainShop ? store.id : 0;
                if (this.exportStore.isMainShop) {
                    if (!this.mainShopMoneyAccount) {
                        this.mainShopMoneyAccount = await this.moneyAccountService.getDefault();
                    }
                    this.exportStore.moneyAccount = this.mainShopMoneyAccount;
                }
                this.exportMoneyAccount = this.exportStore.moneyAccount;
                this.note.exportMoneyAccountId = this.exportMoneyAccount ? this.exportMoneyAccount.id : 0;
            }
        };
        this.navCtrl.push('/store', { callback, searchMode: true });
    }

    removeExportStore(): void {
        this.exportStore = null;
        this.note.exportStoreId = 0;
    }

    async showSearchImportStore() {
        const callback = async (data) => {
            const store = data;
            if (store) {
                this.importStore = store;
                this.note.importStoreId = !store.isMainShop ? store.id : 0;
                if (this.importStore.isMainShop) {
                    if (!this.mainShopMoneyAccount) {
                        this.mainShopMoneyAccount = await this.moneyAccountService.getDefault();
                    }
                    this.importStore.moneyAccount = this.mainShopMoneyAccount;
                }
                this.importMoneyAccount = this.importStore.moneyAccount;
                this.note.importMoneyAccountId = this.importMoneyAccount ? this.importMoneyAccount.id : 0;
            }
        };
        this.navCtrl.push('/store', { callback, searchMode: true });
    }

    removeImportStore(): void {
        this.importStore = null;
        this.note.importStoreId = 0;
    }
}
