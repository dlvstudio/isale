import { Component } from '@angular/core';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import * as _ from 'lodash';
import * as moment from 'moment';

import { IDebt } from './../../models/debt.interface';
import { GalleryComponent } from './../shared/gallery.component';
import { IProduct } from './../../models/product.interface';
import { TradeToCategory } from './../../models/trade-to-category.model';
import { ITradeToCategory } from './../../models/trade-to-category.interface';
import { Trade } from './../../models/trade.model';
import { ITrade } from './../../models/trade.interface';
import { IContact } from './../../models/contact.interface';
import { IMoneyAccount } from '../../models/money-account.interface';
import { IMoneyAccountTransaction } from '../../models/money-account-transaction.interface';
import { ProductNoteItem } from '../../models/product-note.model';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { TradeService } from '../../providers/trade.service';
import { DebtService } from '../../providers/debt.service';
import { StaffService } from '../../providers/staff.service';
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { MoneyAccountService } from '../../providers/money-account.service';
import { MoneyAccountTransactionService } from '../../providers/money-account-transaction.service';
import { UserService } from '../../providers/user.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { OrderService } from '../../providers/order.service';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'trade-add',
    templateUrl: 'trade-add.component.html',
})
export class TradeAddComponent {
    params: any = null;
    contactSelected: IContact;
    moneyAccountSelected: IMoneyAccount;
    moneyAccountTransaction: IMoneyAccountTransaction;
    productSelected: IProduct;
    trade: ITrade = new Trade();
    oldTrade: ITrade = null;
    noteSegment = 'content';
    categories: ITradeToCategory[] = [];
    categoriesToRemove: ITradeToCategory[] = [];
    currency: any;
    pictures: string[] = [];
    imageSize: number;
    storageDirectory = '';
    arr = [];
    lastSamplePictureId = 0;
    tab = 'note';
    isNew = true;
    saveDisabled = false;
    store;
    checkStore;
    selectedStaff;

    constructor(
        public navCtrl: RouteHelperService,
        private barcodeScanner: BarcodeScanner,
        private file: File,
        public translateService: TranslateService,
        private transfer: FileTransfer,
        private camera: Camera,
        private platform: Platform,
        private modalCtrl: ModalController,
        private tradeService: TradeService,
        private debtService: DebtService,
        public staffService: StaffService,
        private contactService: ContactService,
        private productService: ProductService,
        private moneyAccountService: MoneyAccountService,
        private moneyAccountTransactionService: MoneyAccountTransactionService,
        private alertCtrl: AlertController,
        private storeService: StoreService,
        private analyticsService: AnalyticsService,
        private userService: UserService,
        private orderService: OrderService,
    ) {
        this.platform.ready().then(() => {
            if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
                return false;
            }

            if (this.platform.is('ios')) {
                this.storageDirectory = this.file.documentsDirectory;
            } else if (this.platform.is('android')) {
                this.storageDirectory = this.file.dataDirectory;
            } else {
                // exit otherwise, but you could add further types here e.g. Windows
                return false;
            }
        });
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
        await this.analyticsService.setCurrentScreen('trade-add');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit(): Promise<void> {
        this.userService.getAttr('current-currency').then((code) => {
            this.currency = Helper.getCurrencyByCode(code);
        });
        this.selectedStaff = this.staffService.selectedStaff;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.trade = new Trade();
        this.trade.createdAt = moment(new Date()).format(DateTimeService.getDateDbFormat());
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        let tradeId = 0;
        let contactId = 0;
        let productId = 0;
        let debtId = 0;
        let loanId = 0;
        if (data) {
            if (data && data.id) {
                tradeId = data.id;
                this.isNew = false;
            } else if (data && data.contact) {
                contactId = +data.contact;
            } else if (data && data.product) {
                productId = +data.product;
            } else if (data && data.debt) {
                debtId = +data.debt;
            } else if (data && data.loan) {
                loanId = +data.loan;
            }
        }

        if (tradeId && tradeId > 0) {
            const loading = await this.navCtrl.loading();
            this.tradeService.get(tradeId).then(async (trade) => {
                await loading.dismiss();
                this.contactSelected = trade.contact;
                this.productSelected = trade.product;
                this.moneyAccountSelected = trade.moneyAccount;
                this.trade = trade;
                this.oldTrade = JSON.parse(JSON.stringify(trade));
                if (!trade.moneyAccount && !this.staffService.isStaff()) {
                    this.moneyAccountService.getDefault().then((account: IMoneyAccount) => {
                        if (!account) {
                            return;
                        }
                        this.moneyAccountSelected = account;
                        this.trade.moneyAccountId = account.id;
                    });
                }
                this.tradeService.getCategoriesToTrade(tradeId).then((categories: ITradeToCategory[]) => {
                    this.categories = categories;
                });
                this.moneyAccountTransactionService.getMoneyAccountTransactionByTrade(tradeId).then((trx) => {
                    this.moneyAccountTransaction = trx;
                });
                const pictures = trade.imageUrlsJson ? JSON.parse(trade.imageUrlsJson) : [];
                this.pictures = pictures;

                this.buildPictureGrid();
            });
        } else {
            if (!this.staffService.isStaff()) {
                this.moneyAccountService.getDefault().then((account: IMoneyAccount) => {
                    if (!account) {
                        return;
                    }
                    this.moneyAccountSelected = account;
                    this.trade.moneyAccountId = account.id;
                });
            }
            if (contactId && contactId > 0) {
                this.contactService.get(contactId).then((contact: IContact) => {
                    this.contactSelected = contact;
                    this.trade.contactId = contact.id;
                });
            } else if (productId && productId > 0) {
                this.productService.get(productId, 0).then((product: IProduct) => {
                    this.productSelected = product;
                    this.trade.productId = product.id;
                    this.trade.value = product.price;
                });
            } else if (debtId && debtId > 0) {
                this.debtService.get(debtId).then((debt: IDebt) => {
                    if (!debt) {
                        return;
                    }
                    this.productSelected = debt.product;
                    this.trade.productId = debt.product ? debt.product.id : 0;
                    this.contactSelected = debt.contact;
                    this.trade.contactId = debt.contact ? debt.contact.id : 0;
                    this.trade.isPurchase = debt.isPurchase;
                    this.trade.productCount = debt.productCount;
                    this.trade.value = +debt.value - +debt.valuePaid;
                    this.trade.orderId = debt.order ? debt.order.id : 0;
                    this.trade.order = debt.order;
                    this.trade.debtId = debt.id;
                    this.trade.debt = debt;
                    this.trade.note = `${this.translateService.instant('trade-add.debt-explain')} #${debt.id}; `;
                    if (this.trade.order) {
                        this.trade.note += this.translateService.instant('debt-add.order') + ' #' + this.trade.order.orderCode;
                    }
                    if (debt.debtType === 0) { // you borrowed
                        this.trade.isReceived = false;
                    } else if (debt.debtType === 1) { // borrowed-you
                        this.trade.isReceived = true;
                    } else if (debt.debtType === 2) { // you-owned
                        this.trade.isReceived = false;
                    } else if (debt.debtType === 3) { // owned you
                        this.trade.isReceived = true;
                    }
                });
            } else if (loanId && loanId > 0) {
                this.debtService.get(loanId).then((debt: IDebt) => {
                    this.productSelected = debt.product;
                    this.trade.productId = debt.product ? debt.product.id : 0;
                    this.contactSelected = debt.contact;
                    this.trade.contactId = debt.contact ? debt.contact.id : 0;
                    this.trade.isPurchase = debt.isPurchase;
                    this.trade.productCount = debt.productCount;
                    this.trade.value = debt.value;
                    if (debt.debtType === 0) { // you borrowed
                        this.trade.isReceived = true;
                    } else if (debt.debtType === 1) { // borrowed-you
                        this.trade.isReceived = false;
                    }
                });
            } else {

                const arr = [];
                let row = [];
                for (const picture of this.pictures) {
                    row.push(picture);
                    if (row.length === 3) {
                        arr.push(row);
                        row = [];
                    }
                }
                if (row.length > 0) {
                    arr.push(row);
                }
                this.arr = arr;
            }
        }
    }

    async showSearchContact() {
        const callback = (data) => {
            const contact = data;
            if (contact) {
                this.contactSelected = contact;
                this.trade.contactId = contact.id;
            }
        };
        this.navCtrl.push('/contact', { callback, searchMode: true });
    }

    async showSearchMoneyAccount() {
        const callback = (data) => {
            const account = data;
            if (account) {
                this.moneyAccountSelected = account;
                this.trade.moneyAccountId = account.id;
            }
        };
        this.navCtrl.push('/money-account', { callback, searchMode: true });
    }

    async showSearchProduct() {
        const callback = (data) => {
            const product = data;
            if (product) {
                this.productSelected = product;
                this.trade.productId = product.id;
                this.trade.value = product.price;
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async save(): Promise<void> {
        const trade = this.trade;
        if (this.trade.id) {
            if (trade && (trade.orderId || trade.debtId || trade.receivedNoteId || trade.transferNoteId)) {
                alert(this.translateService.instant('trade.trade-related-update-alert'));
                return;
            }
        }
        if (this.trade.debt && this.trade.debt.id && this.trade.value > (+this.trade.debt.value - +this.trade.debt.valuePaid)) {
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('trade-add.debt-amount-reached-warning'),
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                            this.doSave();
                        }
                    },
                    {
                        text: this.translateService.instant('common.cancel'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            return;
        }
        this.doSave();
    }

    async doSave(): Promise<void> {
        this.trade.imageUrlsJson = JSON.stringify(this.pictures);
        if (this.staffService.isStaff()) {
            this.trade.staffId = this.staffService.selectedStaff.id;
        }
        this.saveDisabled = true;
        const loading = await this.navCtrl.loading();
        const currentDate = moment(new Date()).format(DateTimeService.getDateDbFormat());
        if (this.trade.createdAt === currentDate) {
            this.trade.createdAt = moment(new Date()).format(DateTimeService.getDbFormat());
        }
        this.tradeService.saveTrade(this.trade).then(async (id) => {
            this.analyticsService.logEvent('trade-add-save-success');
            const arr: Promise<any>[] = [];
            if (this.contactSelected) {
                const p = this.saveLastActive();
                arr.push(p);
            }
            if (this.trade.debt && this.trade.debtId > 0) {
                this.trade.debt.valuePaid += +this.trade.value - +(this.oldTrade ? this.oldTrade.value : 0);
                if (!this.oldTrade) {
                    this.trade.debt.countPaid++;
                }
                if (this.trade.debt.valuePaid >= this.trade.debt.value) {
                    this.trade.debt.isPaid = true;
                }
                const debtChange = this.debtService.saveDebt(this.trade.debt);
                if (this.trade.order && this.trade.debt.isPaid) {
                    const allDebts = await this.debtService.getDebtsByOrder(this.trade.order.id, null, null);
                    let allDebtsPaid = true;
                    for (const debt of allDebts) {
                        if (!debt.isPaid && debt.id !== this.trade.debt.id) {
                            allDebtsPaid = false;
                            break;
                        }
                    }
                    if (allDebtsPaid) {
                        this.trade.order.status = 3;
                        const orderChange = this.orderService.saveOrder(this.trade.order);
                        arr.push(orderChange);
                    }
                }
                arr.push(debtChange);
            }
            if (this.categories && this.categories.length > 0) {
                const p = this.tradeService.saveCategoriesToTrade(this.categories, +id);
                arr.push(p);
            }
            if (this.categoriesToRemove && this.categoriesToRemove.length > 0) {
                const p = this.tradeService.deleteCategoriesToTrade(this.categoriesToRemove);
                arr.push(p);
            }
            if (this.productSelected && this.productSelected.id && this.trade.isPurchase) {
                const notesOfTrade = await this.productService.getNotesByTrade(this.trade.id);
                let arr2 = [];
                for (const oldNote of notesOfTrade) {
                    arr2.push(this.productService.deleteProductNote(oldNote));
                }
                if (arr2.length) {
                    await Promise.all(arr);
                    arr2 = [];
                }
                const productNote = new ProductNoteItem();
                productNote.tradeId = this.trade.id;
                productNote.contactId = this.trade.contactId;
                productNote.amount = this.trade.value * (this.trade.isReceived ? 1 : -1);
                productNote.unitPrice = this.productSelected.price;
                productNote.unit = this.productSelected.unit;
                productNote.quantity = this.trade.productCount;
                productNote.productId = this.productSelected.id;
                productNote.productName = this.productSelected.title;
                productNote.productCode = this.productSelected.code;
                productNote.note = this.trade.note;
                productNote.staffId = this.staffService.isStaff() ? this.staffService.selectedStaff.id : 0;
                arr.push(this.productService.saveProductNote(productNote));
            }

            Promise.all(arr).then(async () => {
                await loading.dismiss();
                if (this.trade.contact && this.trade.contact.id !== 0) {
                    this.navCtrl.publish('reloadContact', this.trade.contact);
                    this.navCtrl.publish('reloadContactDebt', this.trade.contact.id);
                }
                if (this.trade.debt && this.trade.debt.id !== 0) {
                    this.navCtrl.publish('reloadDebtList', { type: this.trade.debt.debtType.toString() });
                    this.navCtrl.publish('reloadDebt', this.trade.debt);
                }
                if (this.trade.order && this.trade.order.id !== 0) {
                    this.navCtrl.publish('reloadOrder', this.trade.order);
                    this.navCtrl.publish('reloadOrderList', null);
                }
                this.exitPage();
            });
        });
    }

    isDisableMoneyAccount(): boolean {
        if (!this.trade) {
            return true;
        }
        if (this.trade.orderId && !this.trade.debtId) {
            return true;
        }
        if (this.trade.receivedNoteId && !this.trade.debtId) {
            return true;
        }
        return false;
    }

    saveLastActive(): Promise<number> {
        const action = 'trade';
        this.contactSelected.lastActive = DateTimeService.toDbString();
        this.contactSelected.lastAction = action;
        return this.contactService.saveContact(this.contactSelected).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.contactSelected);
            this.navCtrl.publish('reloadContactTrade', this.contactSelected.id);
            return result;
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        this.navCtrl.publish('reloadTradeList');
        this.navCtrl.publish('reloadTrade', this.trade);
        if (this.isNew) {
            await this.navCtrl.push('/trade/detail', { id: this.trade.id });
        }
    }

    changeToMoneyIn(): void {
        this.trade.isReceived = true;
    }

    changeToMoneyOut(): void {
        this.trade.isReceived = false;
    }

    removeCategory(category: ITradeToCategory) {
        if (category.id !== 0) {
            this.categoriesToRemove.push(category);
        }
        _.remove(this.categories, (item: ITradeToCategory) => item.categoryId === category.categoryId);
    }

    async showSearchCategory() {
        const callback = async (data) => {
            const category = data;
            if (category) {
                if (this.categories.findIndex((item: ITradeToCategory) => item.categoryId === category.id) >= 0) {
                    const alert = await this.alertCtrl.create({
                        header: 'Chú ý',
                        subHeader: 'Bạn đã thêm Danh mục này rồi.',
                        buttons: ['OK']
                    });
                    await alert.present();
                } else {
                    const tradeToCategory = new TradeToCategory();
                    tradeToCategory.tradeCategory = category;
                    tradeToCategory.categoryId = category.id;
                    this.categories.push(tradeToCategory);
                }
            }
        };
        this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeContact(): void {
        this.contactSelected = null;
        this.trade.contactId = 0;
    }

    removeMoneyAccount(): void {
        this.moneyAccountSelected = null;
    }

    removeProduct(): void {
        this.productSelected = null;
        this.trade.productId = 0;
        this.trade.productCount = 0;
        this.trade.isPurchase = false;
    }

    changeProductCount(): void {
        if (!this.productSelected || !this.trade.isPurchase) {
            return;
        }
        this.trade.value = this.trade.productCount * this.productSelected.price;
    }

    changeIsPurchase(): void {
        this.trade.productCount = 0;
    }

    showDatePopup(): void {
        this.trade.createdAt = moment().format(DateTimeService.getDateDbFormat());
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    removeDate(): void {
        this.trade.createdAt = '';
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectAll(e): void {
        Helper.selectAll(e);
    }

    refreshAvatar(): void {
        if (this.pictures && this.pictures.length > 0) {
            this.trade.avatarUrl = this.pictures[0];
        } else {
            this.trade.avatarUrl = null;
        }
    }

    takePicture(): void {
        this.addImage(-1, true);
    }

    browsePicture(): void {
        this.addImage(-1, false);
    }

    async showImage(idx: number): Promise<void> {
        const images = JSON.parse(JSON.stringify(this.pictures));
        const modal = await this.modalCtrl.create({
            component: GalleryComponent,
            componentProps: { images, id: idx, canDelete: true }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data && data.idsToDelete) {
            const idsToDelete: any[] = data.idsToDelete;
            for (const id of idsToDelete) {
                this.removePicture(id);
            }
        }
    }

    buildPictureGrid(): void {
        const arr = [];
        let row = [];
        for (const picture of this.pictures) {
            row.push(picture);
            if (row.length === 3) {
                arr.push(row);
                row = [];
            }
        }
        if (row.length > 0) {
            arr.push(row);
        }
        this.arr = arr;
    }

    removePicture(i: number): void {
        this.pictures.splice(i, 1);

        this.buildPictureGrid();

        this.refreshAvatar();
    }

    changePicture(idx: number): void {
        this.addImage(idx, false);
    }

    addImage(idx: number, isCapture: boolean): void {
        if (!this.platform.is('capacitor')) {
            return;
        }
        let sourceType = this.camera.PictureSourceType.CAMERA;
        if (!isCapture) {
            sourceType = this.camera.PictureSourceType.SAVEDPHOTOALBUM;
        }
        this.camera.getPicture({
            destinationType: this.camera.DestinationType.FILE_URI,
            correctOrientation: true,
            saveToPhotoAlbum: false,
            sourceType
        }).then((imageLocation) => {
            const fileName = imageLocation.substr(imageLocation.lastIndexOf('/') + 1);
            const imageId = 'trade_image_' + fileName;
            this.downloadImage(imageId, imageLocation, idx);
        }, (err) => {
            console.error(err);
        });
    }

    downloadImage(imageId: string, imageLocation: string, idx: number) {
        this.platform.ready().then(async () => {
            const fileTransfer = await this.transfer.create();
            const loading = await this.navCtrl.loading();
            fileTransfer.download(imageLocation, this.storageDirectory + imageId).then(async (entry) => {
                this.doAdd(entry.toURL(), idx);
                await loading.dismiss();
            }, async () => {
                await loading.dismiss();
            });
        });
    }

    doAdd(url: string, idx: number): void {
        if (idx >= 0 && idx <= this.pictures.length - 1) {
            this.pictures[idx] = url;
        } else {
            this.pictures.push(url);
        }
        this.buildPictureGrid();
        this.refreshAvatar();
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('trade-add-scan-barcode');
        if (this.navCtrl.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.checkBarcodeScaned(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.checkBarcodeScaned(barcodeData.text);
        });
    }

    checkBarcodeScaned(barcode) {
        this.productService.searchByBarcode(barcode).then(async (product) => {
            if (!product) {
                return;
            }
            this.productSelected = product;
            this.trade.productId = product.id;
        });
    }

    addZerosToNumber(zeroCount: number) {
        let str = '';
        for (let i = 0; i < zeroCount; i++) {
            str += '0';
        }
        if (this.trade && this.trade.value) {
            let num = this.trade.value.toString();
            num += str;
            this.trade.value = Number(num);
        }
    }

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.storeService.exitStore();
                        this.store = null;
                        this.checkStore = null;
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }
}
