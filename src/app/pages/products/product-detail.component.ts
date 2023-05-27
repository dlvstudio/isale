import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { ExcelService } from './../../providers/excel.service';
import { DebtService } from './../../providers/debt.service';
import { IDebt } from './../../models/debt.interface';
import { DateRangeComponent } from './../shared/date-range.component';
import { ITrade } from './../../models/trade.interface';
import { TradeService } from './../../providers/trade.service';
import { Helper } from './../../providers/helper.service';
import { UserService } from './../../providers/user.service';
import { ProductService } from './../../providers/product.service';
import { Product } from './../../models/product.model';
import { IProduct } from './../../models/product.interface';
import { DateTimeService } from './../../providers/datetime.service';

import * as _ from 'lodash';
import * as JsBarcode from 'JsBarcode';

import { IProductNoteItem } from '../../models/product-note.interface';
import { ViewChild, Component, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, Platform, ActionSheetController, AlertController } from '@ionic/angular';
import { GalleryComponent } from '../shared/gallery.component';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ContactService } from '../../providers/contact.service';
import { IStaff } from '../../models/staff.interface';
import { StoreService } from '../../providers/store.service';
import { StaffService } from '../../providers/staff.service';
import { ITradeToCategory } from '../../models/trade-to-category.interface';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'product-detail',
    templateUrl: 'product-detail.component.html',
})
export class ProductDetailComponent {
    @ViewChild('barcode', { static: false }) barcode: ElementRef;
    params: any = null;
    product: IProduct = new Product();
    productAttributes: any[] = [];
    pictures: string[] = [];
    arr = [];
    currency: string;
    dateFrom = '';
    dateTo = '';
    trades: ITrade[] = [];
    total = 0;
    totalProduct = 0;
    tab = 'product-note';
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    barcode64base: any;
    dateNoteFrom = '';
    dateNoteTo = '';
    productNotes: IProductNoteItem[] = [];
    totalNoteAmount = 0;
    customerPrices = [];
    customerDiscounts = [];
    store: any;
    checkStore: string;
    staff: IStaff = null;
    filteredStaff: IStaff = null;
    stores: any[];
    categories: ITradeToCategory[] = [];
    canViewProductCostPrice = false;

    constructor(
        public navCtrl: RouteHelperService,
        private file: File,
        private printer: Printer,
        public translateService: TranslateService,
        private userService: UserService,
        private modalCtrl: ModalController,
        private productService: ProductService,
        private tradeService: TradeService,
        private debtService: DebtService,
        private contactService: ContactService,
        private platform: Platform,
        private excelService: ExcelService,
        private storeService: StoreService,
        private staffService: StaffService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private currencyPipe: CurrencyPipe,
        private analyticsService: AnalyticsService
    ) {
        this.navCtrl.removeEventListener('reloadProduct', this.reloadProduct);
        this.navCtrl.addEventListener('reloadProduct', this.reloadProduct);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-detail');
    }

    gotoCat(id) {
        this.navCtrl.push('/trade-category/detail', { id });
    }

    reloadProduct = (e) => {
        const product = e.detail;
        if (this.product && product.id === this.product.id) {
            this.reload();
        }
    }

    // tslint:disable-next-line:use-lifecycle-interface
    async ngOnInit() {
        await this.reload();
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    async reload(): Promise<void> {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.stores = await this.storeService.getStores();
        this.staff = this.staffService.selectedStaff;
        this.store = await this.storeService.getCurrentStore();
        this.canViewProductCostPrice = !this.staff || this.staff.hasFullAccess || this.staff.canViewProductCostPrice;
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        this.product = new Product();
        if (data.tab) {
            this.tab = data.tab;
        }
        this.filteredStaff = data.selectedStaff;
        const id = data.id;
        this.productService.get(id, this.store ? this.store.id : 0).then(async (product) => {
            this.productAttributes = await this.productService.getProductAttributes(id);
            await loading.dismiss();
            this.product = product;
            if (this.product.barcode) {
                setTimeout(() => {
                    JsBarcode(this.barcode.nativeElement, this.product.barcode,
                        { displayValue: true, fontSize: 12.5, textMargin: 0, height: 50, margin: 3 });
                    this.barcode64base = this.barcode.nativeElement.toDataURL('image/png');
                }, 1000);
            }
            this.pictures = product && product.imageUrlsJson ? JSON.parse(product.imageUrlsJson) : [];
            this.product.items = product && product.itemsJson ? JSON.parse(product.itemsJson) : [];
            this.product.units = product && product.unitsJson ? JSON.parse(product.unitsJson) : [];
            this.product.materials = product && product.materialsJson ? JSON.parse(product.materialsJson) : [];
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

            // this.dateFrom = '';
            // this.dateTo = '';
            this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
            this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();

            this.tradeService.getTradesByProduct(product.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                this.totalProduct = _.sumBy(this.trades, (item: ITrade) => item.productCount);
            });

            this.dateDebtFrom = '';
            this.dateDebtTo = '';
            this.dateDebtFrom = DateTimeService.GetFirstDateOfMonth();
            this.dateDebtTo = DateTimeService.GetEndDateOfMonth();

            this.debtService.getDebtsByProduct(product.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
            });

            this.dateNoteFrom = '';
            this.dateNoteTo = '';
            this.dateNoteFrom = DateTimeService.GetFirstDateOfMonth();
            this.dateNoteTo = DateTimeService.GetEndDateOfMonth();

            this.productService
                .getNotesByProduct(product.id, this.filteredStaff ? this.filteredStaff.id : 0, this.dateNoteFrom, this.dateNoteTo, this.store ? this.store.id : 0)
                .then((notes: IProductNoteItem[]) => {
                    if (notes && notes.length > 0) {
                        if (this.filteredStaff) {
                            for (const note of notes) {
                                note.staff = this.filteredStaff;
                            }
                        }
                        notes = _.orderBy(notes, ['createdAt'], ['desc']);
                    }
                    const arr2 = [];
                    for (const note of notes) {
                        note.store = !this.checkStore && note.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id === note.storeId)
                            : null;
                        arr2.push(note);
                    }
                    this.productNotes = arr2;
                    this.totalNoteAmount = _.sumBy(this.productNotes, (item: IProductNoteItem) => {
                        const amount = item.orderId
                            ? item.amount
                            : item.receivedNoteId
                                ? -item.amount
                                : 0;
                        return amount;
                    });
                });

            this.contactService.getCustomerPricesByProduct(product.id).then((customerPrices: any[]) => {
                if (customerPrices && customerPrices.length > 0) {
                    customerPrices = _.orderBy(customerPrices, ['createdAt'], ['desc']);
                }
                this.customerPrices = customerPrices;
            });

            this.contactService.getCustomerDiscountsByProduct(product.id).then((customerDiscounts: any[]) => {
                if (customerDiscounts && customerDiscounts.length > 0) {
                    customerDiscounts = _.orderBy(customerDiscounts, ['createdAt'], ['desc']);
                }
                this.customerDiscounts = customerDiscounts;
            });

            this.categories = await this.tradeService.getCategoriesToTrade(this.product.id);
        });
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        const hasPermission = this.staffService.canAddUpdateProduct();
        if (!hasPermission) {
            alert(this.translateService.instant('product.no-permission'));
            return;
        }
        this.navCtrl.push('/product/edit', { id: this.product.id });
    }

    async showImage(id: number): Promise<void> {
        const images = JSON.parse(JSON.stringify(this.pictures));
        const modal = await this.modalCtrl.create({
            component: GalleryComponent,
            componentProps: { images, id }
        });
        await modal.present();
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('product-detail.copy'),
                    handler: () => {
                        this.copyProduct();
                    }
                }, {
                    text: this.translateService.instant('product-detail.generate-barcode'),
                    handler: () => {
                        this.generateBarcode();
                    }
                }, {
                    text: this.translateService.instant('product-detail.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteProduct();
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    async copyProduct() {
        const copy = JSON.parse(JSON.stringify(this.product));
        await this.navCtrl.popOnly();
        this.navCtrl.push('/product/quick-add', { copy });
    }

    generateBarcode(): void {
        if (!this.product || this.product.barcode) {
            return;
        }

        this.barcode64base = 1;

        setTimeout(() => {
            JsBarcode(this.barcode.nativeElement, this.product.id.toString(), { displayValue: false });
            this.barcode64base = this.barcode.nativeElement.toDataURL('image/png');
        }, 1000);

        if (!(this.platform.is('capacitor') || this.platform.is('cordova'))) {
            return;
        }

        const imgWithMeta = this.barcode64base.split(',');
        // base64 data
        const imgData = imgWithMeta[1].trim();
        // content type
        const imgType = imgWithMeta[0].trim().split(';')[0].split(':')[1];

        // this.fs is correctly set to cordova.file.externalDataDirectory
        const filename = 'barcode-' + Helper.productName(this.product.code, this.product.title) + '.png';

        this.file.resolveLocalFilesystemUrl(this.file.externalDataDirectory).then(async (dirEntry) => {
            const nativeURL = dirEntry.toURL();
            Helper.savebase64AsImageFile(nativeURL, filename, imgData, imgType);
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('product-detail.barcode-saved-alert')
                    + this.file.externalDataDirectory + filename,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
        });
    }

    printBarcode(): void {
        const price = this.currencyPipe.transform(this.product.price, this.currency, 'symbol', '1.0-2', this.translateService.currentLang);

        const html = `<div style='text-align: center;'><img src='${this.barcode64base}'/><span>
        <div>
        <b>${this.product.title}.&nbsp;<span>${price}</span></b><span>
        </div></div>`;

        if (this.navCtrl.isNotCordova()) {
            Helper.webPrint(html);
            return;
        }
        this.printer.print(html).then(() => { });
    }

    addTrade(): void {
        this.navCtrl.push('/trade/add', { product: this.product.id });
    }

    addDebt(): void {
        this.navCtrl.push('/debt/add', { product: this.product.id });
    }

    exportTradeToExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.product-transaction-report')]);
        data.push([
            this.translateService.instant('export.product') + ': ' +
            Helper.productName(this.product.code, this.product.title)
        ]);

        if (this.dateFrom && this.dateTo) {
            const strFrom = this.translateService.instant('common.from');
            const strTo = this.translateService.instant('common.to');
            const str = strFrom + ' ' + this.dateFormat(this.dateFrom) + ' ' + strTo + ' ' + this.dateFormat(this.dateTo);
            data.push([str]);
        }
        data.push([
            this.translateService.instant('common.total') + ': ' +
            this.total + ' ' +
            this.currency
        ]);
        data.push([
            this.translateService.instant('export.contact'),
            this.translateService.instant('export.product'),
            this.translateService.instant('export.product-count'),
            this.translateService.instant('export.money'),
            this.translateService.instant('export.unit'),
            this.translateService.instant('export.date')
        ]);
        for (const trade of this.trades) {
            data.push([
                trade.contactId !== 0 && trade.contact ? trade.contact.fullName : '',
                trade.productId !== 0 && trade.product ? Helper.productName(trade.product.code, trade.product.title) : '',
                trade.productId !== 0 && trade.product && trade.isPurchase
                    ? trade.productCount ? trade.productCount : 0
                    : ' ',
                trade.isReceived ? trade.value : -1 * trade.value,
                this.currency,
                this.dateFormat(trade.createdAt)
            ]);
        }
        const sheet = this.excelService.createSheetData(data);
        const fileName = 'product-transactions-report-' + this.product.id + '-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async () => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile();
        });
    }

    async deleteProduct(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.deleteRelated();
                        this.productService.deleteProduct(this.product).then(async () => {
                            this.analyticsService.logEvent('product-detail-delete-success');
                            this.navCtrl.publish('reloadProductList');
                            this.navCtrl.pop();
                        });
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

    async deleteRelated() {
        const arr: Promise<any>[] = [];
        const productNotesToDelete = await this.productService.getNotesByProduct(this.product.id, 0);
        for (const item of productNotesToDelete) {
            arr.push(this.productService.deleteProductNote(item));
        }
        await Promise.all(arr);
    }

    selectNote(note: IProductNoteItem): void {
        if (note.tradeId) {
            this.navCtrl.push('/trade/detail', { id: note.tradeId });
        } else if (note.orderId) {
            this.navCtrl.push('/order/detail', { id: note.orderId });
        } else if (note.receivedNoteId) {
            this.navCtrl.push('/received-note/detail', { id: note.receivedNoteId });
        }
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
    }

    selectDebt(id: number): void {
        this.navCtrl.push('/debt/detail', { id });
    }

    async selectDateRangeForTrade(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo, page: 'product', selectedStaff: this.filteredStaff }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom !== '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.filteredStaff = data.selectedStaff;
            this.tradeService.getTradesByProduct(this.product.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                if (trades && trades.length > 0) {
                    trades = _.orderBy(trades, ['modifiedAt'], ['desc']);
                }
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }

    async selectDateRangeForNote(): Promise<void> {
        const callback = (data) => {
            if (!data) {
                return;
            }
            if (data.dateFrom !== '') {
                this.dateNoteFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateNoteFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateNoteTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateNoteTo = '';
            }
            this.filteredStaff = data.selectedStaff;
            this.productService
                .getNotesByProduct(this.product.id, this.filteredStaff ? this.filteredStaff.id : 0, this.dateNoteFrom, this.dateNoteTo, this.store ? this.store.id : 0)
                .then((notes: IProductNoteItem[]) => {
                    if (notes && notes.length > 0) {
                        if (this.filteredStaff) {
                            for (const note of notes) {
                                note.staff = this.filteredStaff;
                            }
                        }
                        notes = _.orderBy(notes, ['createdAt'], ['desc']);
                    }
                    const arr = [];
                    for (const note of notes) {
                        note.store = !this.checkStore && note.storeId && this.stores && this.stores.length
                            ? this.stores.find(s => s.id === note.storeId)
                            : null;
                        arr.push(note);
                    }
                    this.productNotes = arr;
                    this.totalNoteAmount = _.sumBy(this.productNotes, (item: IProductNoteItem) => {
                        const amount = item.orderId
                            ? item.amount
                            : item.receivedNoteId
                                ? -item.amount
                                : 0;
                        return amount;
                    });
                });
        }
        this.navCtrl.push('/order/select-filter', { callback, dateFromInput: this.dateFrom, dateToInput: this.dateTo, page: 'product', selectedStaff: this.filteredStaff })
    }

    async selectDateRangeForDebt(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo, page: 'product', selectedStaff: this.filteredStaff }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom !== '') {
                this.dateDebtFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateDebtFrom = '';
            }
            if (data.dateTo !== '') {
                this.dateDebtTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateDebtTo = '';
            }
            this.filteredStaff = data.selectedStaff;
            this.debtService.getDebtsByProduct(this.product.id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                if (debts && debts.length > 0) {
                    debts = _.orderBy(debts, ['modifiedAt'], ['desc']);
                }
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
            });
        }
    }

    productName(title, code): string {
        if (title || code) {
            return Helper.productName(title, code);
        }
        return Helper.productName(this.product.code, this.product.title);
    }

    getAttributesString(product) {
        return Helper.getAttributesString(product);
    }

    hasOptionsOrAttributes(product) {
        return Helper.hasOptionsOrAttributes(product);
    }

    addPrice() {
        this.navCtrl.push('/contact/add-price', { product: this.product.id });
    }

    selectCustomerPrice(id) {
        this.navCtrl.push('/contact/add-price', { id });
    }

    addDiscount() {
        this.navCtrl.push('/contact/add-discount', { product: this.product.id });
    }

    selectCustomerDiscount(id) {
        this.navCtrl.push('/contact/add-discount', { id });
    }

    async viewTypes() {
        this.navCtrl.push('/product/type', { callback: () => { }, productId: this.product.id, product: this.product });
    }

    addOtherBarcode() {
        this.navCtrl.push('/product/barcode', { productId: this.product.id, units: this.product.units, callback: () => { } });
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
                        this.navCtrl.publish('reloadProductList');
                        this.navCtrl.publish('reloadProductSelector');
                        this.navCtrl.publish('reloadProduct', this.product);
                        await this.reload();
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
