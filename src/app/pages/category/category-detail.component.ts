import { IDebt } from './../../models/debt.interface';
import { DateRangeComponent } from './../shared/date-range.component';
import { IContact } from './../../models/contact.interface';
import { TradeCategory } from './../../models/trade-category.model';
import { ITradeCategory } from './../../models/trade-category.interface';
import { ITrade } from './../../models/trade.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../providers/user.service';
import { ModalController, Platform, ActionSheetController, AlertController } from '@ionic/angular';
import { TradeService } from '../../providers/trade.service';
import { DebtService } from '../../providers/debt.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';
import { IProduct } from '../../models/product.interface';
import { ProductService } from '../../providers/product.service';
import { TradeToCategory } from '../../models/trade-to-category.model';
import { ContactService } from '../../providers/contact.service';

@Component({
    selector: 'category-detail',
    templateUrl: 'category-detail.component.html',
})
export class CategoryDetailComponent {
    category: ITradeCategory = new TradeCategory();
    params: any = null;
    originalTrades: ITrade[] = [];
    trades: ITrade[] = [];
    originalProducts: IProduct[];
    products: IProduct[];
    isMobile = true;
    customerDiscounts = [];
    searchKey = '';
    dateFrom = '';
    dateTo = '';
    total = 0;
    currency: string;
    tab = 'product';
    originalDebts: IDebt[] = [];
    debts: IDebt[] = [];
    dateDebtFrom = '';
    dateDebtTo = '';
    totalDebt = 0;
    searchDebtKey = '';
    selectMode = false;
    isSelectAll = false;

    constructor(
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private userService: UserService,
        private modalCtrl: ModalController,
        private tradeService: TradeService,
        private debtService: DebtService,
        private file: File,
        private platform: Platform,
        private excelService: ExcelService,
        private actionSheetCtrl: ActionSheetController,
        private productService: ProductService,
        private alertCtrl: AlertController,
        private contactService: ContactService,
        private analyticsService: AnalyticsService,
    ) {
        const reloadCategoryHandle = (event) => {
            const category = event.detail;
            if (this.category && category.id === this.category.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadTradeCategory', reloadCategoryHandle);
        this.navCtrl.subscribe('reloadTradeCategory', reloadCategoryHandle);

        this.navCtrl.unsubscribe('reloadTradeList', this.reload);
        this.navCtrl.subscribe('reloadTradeList', this.reload);

        this.navCtrl.unsubscribe('reloadDebtList', this.reload);
        this.navCtrl.subscribe('reloadDebtList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('category-detail');
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    reload(): void {
        this.isMobile = this.platform.width() < 720;
        this.category = new TradeCategory();
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.tab) {
            this.tab = data.tab;
        }
        if (data && data.id && data.id > 0) {
            const id = data.id;
            this.tradeService.getCategory(id).then(async (category) => {
                this.category = category;
                // this.dateFrom = '';
                // this.dateTo = '';
                if (data.dateFrom) {
                    this.dateFrom = data.dateFrom;
                } else {
                    this.dateFrom = this.dateFrom ? this.dateFrom : DateTimeService.GetFirstDateOfMonth();
                }
                if (data.dateTo) {
                    this.dateTo = data.dateTo;
                } else {
                    this.dateTo = this.dateTo ? this.dateTo : DateTimeService.GetEndDateOfMonth();
                }
                this.tradeService.getTradesByCategory(id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                    this.originalTrades = JSON.parse(JSON.stringify(trades));
                    trades = this.sortByModifiedAt(trades);
                    this.trades = trades;
                    this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
                });

                this.products = await this.productService.getProductsByCategory(id);
                this.originalProducts = JSON.parse(JSON.stringify(this.products));
                this.dateDebtFrom = '';
                this.dateDebtTo = '';
                if (data.dateDebtFrom) {
                    this.dateDebtFrom = data.dateDebtFrom;
                } else {
                    this.dateDebtFrom = DateTimeService.GetFirstDateOfMonth();
                }
                if (data.dateDebtTo) {
                    this.dateDebtTo = data.dateDebtTo;
                } else {
                    this.dateDebtTo = DateTimeService.GetEndDateOfMonth();
                }
                this.debtService.getDebtsByCategory(id, this.dateDebtFrom, this.dateDebtTo).then((debts: IDebt[]) => {
                    this.originalDebts = JSON.parse(JSON.stringify(debts));
                    debts = this.sortByModifiedAt(debts);
                    this.debts = debts;
                    this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
                });

                this.contactService.getCustomerDiscountsByCategory(id).then((customerDiscounts: any[]) => {
                    if (customerDiscounts && customerDiscounts.length > 0) {
                        customerDiscounts = _.orderBy(customerDiscounts, ['createdAt'], ['desc']);
                    }
                    this.customerDiscounts = customerDiscounts;
                });
            });
        }
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    sortByModifiedAt(lst: any[]): any[] {
        if (lst) {
            return _.orderBy(lst, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/trade-category/add', { id: this.category.id });
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('category-detail-search');
        let trades: ITrade[] = JSON.parse(JSON.stringify(this.originalTrades));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            trades = trades.filter((item) => (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.trades = trades;
        this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    searchDebt(): void {
        let debts: IDebt[] = JSON.parse(JSON.stringify(this.originalDebts));
        if (this.searchDebtKey !== null && this.searchDebtKey !== '') {
            const searchKey = this.searchDebtKey.toLowerCase();
            debts = debts.filter((item) => (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.debts = debts;
        this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
    }

    clearSearchDebt() {
        this.searchDebtKey = null;
        this.reload();
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('export.export-trade'),
                    handler: () => {
                        this.exportTradeToExcel();
                    }
                }, {
                    text: this.translateService.instant('trade-category.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteCategory();
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

    exportTradeToExcel(): void {
        const data = [];
        data.push([this.translateService.instant('export.category-transaction-report')]);
        data.push([
            this.translateService.instant('export.category') + ': ' +
            this.category.title
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
        const fileName = 'category-transactions-' + this.category.id + '-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
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
            this.userService.shareFile(null, content);
        });
    }

    async deleteCategory(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('trade-category.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.tradeService.deleteCategory(this.category).then(async () => {
                            this.analyticsService.logEvent('category-detail-delete-success');
                            this.navCtrl.publish('reloadTradeCategoryList', null);
                            this.navCtrl.pop();
                        });
                    }
                },
            ]
        });
        confirm.present();
    }

    selectTrade(id: number): void {
        this.navCtrl.push('/trade/detail', { id });
    }

    selectDebt(id: number): void {
        this.navCtrl.push('/debt/detail', { id });
    }

    async deleteTrade(trade: ITrade): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('trade.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.tradeService.deleteTrade(trade).then(async () => {
                            this.analyticsService.logEvent('category-detail-delete-trade-success');
                            let i = this.trades.findIndex(item => item.id === trade.id);
                            if (i >= 0) {
                                this.trades.splice(i, 1);
                            }
                            i = this.originalTrades.findIndex(item => item.id === trade.id);
                            if (i >= 0) {
                                this.originalTrades.splice(i, 1);
                            }
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async deleteDebt(debt: IDebt): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('debt.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.debtService.deleteDebt(debt).then(async () => {
                            this.analyticsService.logEvent('category-detail-delete-debt-success');
                            let i = this.debts.findIndex(item => item.id === debt.id);
                            if (i >= 0) {
                                this.debts.splice(i, 1);
                            }
                            i = this.originalDebts.findIndex(item => item.id === debt.id);
                            if (i >= 0) {
                                this.originalDebts.splice(i, 1);
                            }
                        });
                    }
                },
            ]
        });
        await confirm.present();
    }

    async presentTradeActionSheet(trade: ITrade) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('trade.delete-trade'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteTrade(trade);
                    }
                }, {
                    text: this.translateService.instant('trade.edit-trade'),
                    handler: () => {
                        this.selectTrade(trade.id);
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

    async presentDebtActionSheet(debt: IDebt) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('debt.delete-debt'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteDebt(debt);
                    }
                }, {
                    text: this.translateService.instant('debt.edit-debt'),
                    handler: () => {
                        this.selectDebt(debt.id);
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

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    async selectDateRangeForTrade(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateFrom, dateToInput: this.dateTo },
            backdropDismiss: false
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateFrom = '';
            }
            if (data.dateTo != '') {
                this.dateTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateTo = '';
            }
            this.tradeService.getTradesByCategory(this.category.id, this.dateFrom, this.dateTo).then((trades: ITrade[]) => {
                this.originalTrades = JSON.parse(JSON.stringify(trades));
                trades = this.sortByModifiedAt(trades);
                this.trades = trades;
                this.total = _.sumBy(this.trades, (item: ITrade) => item.value * (item.isReceived ? 1 : -1));
            });
        }
    }

    async selectDateRangeForDebt(): Promise<void> {
        const modal = await this.modalCtrl.create({
            component: DateRangeComponent,
            componentProps: { dateFromInput: this.dateDebtFrom, dateToInput: this.dateDebtTo }
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        if (data) {
            if (data.dateFrom != '') {
                this.dateDebtFrom = DateTimeService.toDbString(data.dateFrom, DateTimeService.getDbFormat());
            } else {
                this.dateDebtFrom = '';
            }
            if (data.dateTo != '') {
                this.dateDebtTo = DateTimeService.toDbString(data.dateTo, DateTimeService.getDbFormat());
            } else {
                this.dateDebtTo = '';
            }
            this.debtService.getDebtsByCategory(this.category.id, this.dateFrom, this.dateTo).then((debts: IDebt[]) => {
                this.originalTrades = JSON.parse(JSON.stringify(debts));
                debts = this.sortByModifiedAt(debts);
                this.debts = debts;
                this.totalDebt = _.sumBy(this.debts, (item: IDebt) => item.value);
            });
        }
    }

    changeListOption() {
        this.reload();
    }

    showSelect() {
        this.selectMode = true;
        this.isSelectAll = false;
    }

    exitSelectMode() {
        this.selectMode = false;
        this.isSelectAll = false;
        for (const product of this.products) {
            product.isSelected = false;
        }
    }

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    selectProduct(id: number): void {
        if (this.selectMode) {
            return;
        }
        try {
            this.navCtrl.navigateForward('/product/detail', { id });
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }

    async presentProductActionSheet(product: IProduct) {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('product-detail.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteProduct(product);
                    }
                }, {
                    text: this.translateService.instant('product-detail.view-detail'),
                    handler: () => {
                        this.selectProduct(product.id);
                    }
                }, {
                    text: this.translateService.instant('product-detail.multi-select'),
                    handler: () => {
                        this.selectMode = true;
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

    async deleteProduct(product: IProduct): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.productService.deleteProduct(product).then(async () => {
                            this.analyticsService.logEvent('product-delete-success');
                            let i = this.products.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.products.splice(i, 1);
                            }
                            i = this.originalProducts.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.originalProducts.splice(i, 1);
                            }
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

    async multiDelete() {
        const count = this.products ? this.products.filter(t => t.isSelected).length : 0;
        if (count === 0) {
            alert(this.translateService.instant('product-detail.multi-delete-no-product-alert'));
            return;
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('product-detail.multi-delete-alert', { count }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const loading = await this.navCtrl.loading();
                        const productsToDelete = [];
                        const arr = [];
                        for (const product of this.products) {
                            if (product.isSelected) {
                                productsToDelete.push(product);
                                arr.push(this.productService.deleteProduct(product));
                            }
                        }
                        await Promise.all(arr);
                        for (const product of productsToDelete) {
                            this.analyticsService.logEvent('product-delete-success');
                            let i = this.products.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.products.splice(i, 1);
                            }
                            i = this.originalProducts.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.originalProducts.splice(i, 1);
                            }
                        }
                        this.selectMode = false;
                        await loading.dismiss();
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

    selectAll() {
        for (const product of this.products) {
            product.isSelected = this.isSelectAll;
        }
    }

    async showSearchProduct() {
        const callback = async (data) => {
            if (!data || !data.length) {
                return;
            }
            for (const product of data) {
                await this.addProductFromArr(product);
            }
            this.reload();
        };
        this.navCtrl.push('/category/category-product-selector', { callback });
    }

    async addProductFromArr(product) {
        const tradeToCategory = new TradeToCategory();
        tradeToCategory.categoryId = this.category.id;
        const olds = await this.tradeService.getCategoriesToTrade(product.id);
        await this.tradeService.saveCategoriesToTrade([tradeToCategory], product.id);
        const arr = [];
        for (const item of olds) {
            if (item.categoryId === this.category.id) {
                arr.push(item);
            }
        }
        if (arr) {
            await this.tradeService.deleteCategoriesToTrade(arr);
        }
    }

    async searchProduct(): Promise<void> {
        this.analyticsService.logEvent('product-search');
        let products: IProduct[] = JSON.parse(JSON.stringify(this.originalProducts));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.products = products;
    }

    clearSearchProduct() {
        this.selectMode = false;
        this.searchKey = null;
        this.reload();
    }

    addDiscount() {
        this.navCtrl.push('/contact/add-discount', { category: this.category.id });
    }

    selectCustomerDiscount(id) {
        this.navCtrl.push('/contact/add-discount', { id });
    }
}
