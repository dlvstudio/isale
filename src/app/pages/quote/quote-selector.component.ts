import { Component, ViewChild } from '@angular/core';
import { Platform, AlertController, ModalController, IonContent } from '@ionic/angular';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BarcodeInputComponent } from '../shared/barcode-input.component';
import { QuoteService } from '../../providers/quote.service';
import { UserService } from '../../providers/user.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { IProduct } from '../../models/product.interface';
import { PlanService } from '../../providers/plan.service';
import { StoreService } from '../../providers/store.service';
import { IStaff } from '../../models/staff.interface';
import { StaffService } from '../../providers/staff.service';

@Component({
    selector: 'quote-selector',
    templateUrl: 'quote-selector.component.html'
})
export class QuoteSelectorComponent {
    @ViewChild(IonContent, { static: true }) content: IonContent;
    callback: any;
    params: any = null;
    originalQuotes: any[];
    quotes: any[];
    searchKey = '';
    noteFilter = 'frequency';
    total = 0;
    currency: string;
    selectedProducts: any[] = [];
    isMobile = true;
    checkQuote = 0;
    currentPlan: any = null;
    isOnTrial = false;
    store: any;
    storeSelected: any;
    checkStore: string;
    selectedStaff: IStaff = null;
    stores: any[];
    start = 0;
    pageSize = 40;
    end = 39;
    currentPage = 0;
    selectMode = false;
    isSelectAll = false;
    tab = 'all';

    constructor(
        private platform: Platform,
        private quoteService: QuoteService,
        public translateService: TranslateService,
        private userService: UserService,
        private productService: ProductService,
        private barcodeScanner: BarcodeScanner,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private storeService: StoreService,
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private planService: PlanService,
        public staffService: StaffService,
    ) {
        this.navCtrl.removeEventListener('reloadQuoteList', this.reload);
        this.navCtrl.addEventListener('reloadQuoteList', this.reload);
    }

    // tslint:disable-next-line: use-lifecycle-interface
    ngOnInit(): void {
        this.platform.resize.subscribe(() => {
            this.isMobile = this.platform.width() < 720;
        });
        this.reload();
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('quote');
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.isMobile = this.platform.width() < 720;
        this.currency = await this.userService.getAttr('current-currency');
        this.currentPlan = await this.planService.getCurrentPlan();
        this.stores = await this.storeService.getStores();
        this.selectedStaff = this.staffService.selectedStaff;
        if (!this.currentPlan) {
            this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
        }
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.selectedStaff) {
            this.selectedStaff = this.params.selectedStaff;
        }
        if (!this.params) {
            this.params = { selectedStaff: null };
        }
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        this.quoteService.getQuotes(this.selectedStaff ? this.selectedStaff.id : null).then(async (quotes) => {
            const arr = [];
            if (quotes && quotes.length) {
                for (const quote of quotes) {
                    quote.items = JSON.parse(quote.itemsJson);
                    quote.store = !this.checkStore && quote.storeId && this.stores && this.stores.length
                        ? this.stores.find(s => s.id === quote.storeId)
                        : null;
                    arr.push(quote);
                }
            }
            this.originalQuotes = JSON.parse(JSON.stringify(arr));
            this.quotes = arr;
            this.total = _.sumBy(this.quotes, (item: any) => item.total);
            this.filter();
            await loading.dismiss();
        }).catch(async () => {
            await loading.dismiss();
        });
    }

    openQuoteAdd(): void {
        if (!this.currentPlan && !this.isOnTrial) {
            this.analyticsService.logEvent('check-quote-alert');
            alert(this.translateService.instant('quote.check-quote-alert', { total: this.checkQuote }));
            return;
        }
        this.navCtrl.navigateForward('/quote/add', null);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('quote-search');
        let quotes: any[] = JSON.parse(JSON.stringify(this.originalQuotes));
        if (this.searchKey !== null && this.searchKey !== '') {
            this.start = 0;
            this.end = this.pageSize - 1;
            this.currentPage = 0;
            const searchKey = this.searchKey.toLowerCase();
            quotes = quotes.filter((item) => (item.contact && item.contact.fullName && item.contact.fullName.toLowerCase().indexOf(searchKey) !== -1)
                || (item.contact && item.contact.mobile && item.contact.mobile.toLowerCase().indexOf(searchKey) !== -1)
                || (item.contactName && item.contactName.toLowerCase().indexOf(searchKey) !== -1)
                || (item.staff && item.staff.name.toLowerCase().indexOf(searchKey) !== -1)
                || (item.staff && item.staff.userName.toLowerCase().indexOf(searchKey) !== -1)
                || (item.store && item.store.name && item.store.name.toLowerCase().indexOf(searchKey) !== -1)
                || (item.contactPhone && item.contactPhone.toLowerCase().indexOf(searchKey) !== -1)
                || (item.note && item.note.toLowerCase().indexOf(searchKey) !== -1)
                || (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1)
                || (item.hasShipInfo && item.billOfLadingCode && item.billOfLadingCode.toLowerCase().indexOf(searchKey) !== -1)
                || (item.hasShipInfo && item.shippingPartner && item.shippingPartner.toLowerCase().indexOf(searchKey) !== -1)
                || (item.hasShipInfo && item.shipperName && item.shipperName.toLowerCase().indexOf(searchKey) !== -1)
                || (item.hasShipInfo && item.shipperPhone && item.shipperPhone.toLowerCase().indexOf(searchKey) !== -1)
                || (item.hasShipInfo && item.deliveryAddress && item.deliveryAddress.toLowerCase().indexOf(searchKey) !== -1)
                || (item.items && item.items.length
                    && item.items.filter(p => (p.productCode && p.productCode.toLowerCase().indexOf(searchKey) !== -1)
                        || (p.productName && p.productName.toLowerCase().indexOf(searchKey) !== -1)
                        || (p.note && p.note.toLowerCase().indexOf(searchKey) !== -1)).length > 0)
            );
        }
        this.quotes = quotes;
        this.total = _.sumBy(this.quotes, (item: any) => item.total);
    }

    clearSearch() {
        this.start = 0;
        this.end = this.pageSize - 1;
        this.currentPage = 0;
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let quotes: any[] = JSON.parse(JSON.stringify(this.originalQuotes));
        quotes = this.sortByModifiedAt(quotes);
        this.quotes = quotes;
    }

    sortByModifiedAt(quotes: any[]): any[] {
        if (quotes) {
            return _.orderBy(quotes, ['createdAt'], ['desc']);
        }
        return null;
    }

    dateOnlyFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    selectQuote(quote: any): void {
        quote.isSelected = !quote.isSelected;
        if (quote.isSelected) {
            for (const item of quote.items) {
                this.selectedProducts.push(item);
            }
        } else {
            for (const item of quote.items) {
                this.selectedProducts = this.selectedProducts.filter(p => p.productId != item.productId);
            }
        }
    }

    dateFormat(date: string): string {
        let dateChanged = date;
        if (date.indexOf(':00Z') < 0) {
            dateChanged = moment(date).format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    async scan(): Promise<void> {
        this.analyticsService.logEvent('quote-scan-barcode');
        if (this.isNotCordova()) {
            const modal = await this.modalCtrl.create({ component: BarcodeInputComponent });
            await modal.present();
            const { data } = await modal.onDidDismiss();
            if (data && data.barcode) {
                this.doEnteredBarcode(data.barcode);
            }
            return;
        }
        this.barcodeScanner.scan().then((barcodeData) => {
            // Success! Barcode data is here
            if (!barcodeData || !barcodeData.text) {
                return;
            }
            this.doEnteredBarcode(barcodeData.text);
        });
    }

    doEnteredBarcode = (barcode) => {
        if (!barcode) {
            return;
        }
        this.productService.searchByBarcode(barcode).then((product: IProduct) => {
            if (product) {
                this.analyticsService.logEvent('quote-scan-barcode-ok');
                this.navCtrl.push('/quote/add', { product: product.id });
                return;
            }
        });
    }

    goHelpPage(page) {
        this.navCtrl.push('/help/' + page);
    }

    requestProPlan() {
        this.navCtrl.push('/request-pro');
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
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

    productName(code: string, title: string): string {
        return Helper.productName(code, title);
    }

    get isShowPaging() {
        if (this.quotes && this.quotes.length > this.pageSize) {
            return true;
        }
        return false;
    }

    previousPage() {
        if (this.currentPage <= 0) {
            this.currentPage = 0;
            return;
        }
        this.currentPage--;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.quotes.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }

    showSelect() {
        this.selectMode = true;
        this.isSelectAll = false;
    }

    exitSelectMode() {
        this.selectMode = false;
        this.isSelectAll = false;
        for (const quote of this.quotes) {
            quote['isSelected'] = false;
        }
    }

    async multiDelete() {
        const count = this.quotes ? this.quotes.filter(t => t['isSelected']).length : 0;
        if (count === 0) {
            alert(this.translateService.instant('quote-detail.multi-delete-no-quote-alert'));
            return;
        }
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('quote-detail.multi-delete-alert', { count }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        const loading = await this.navCtrl.loading();
                        const productsToDelete = [];
                        const arr = [];
                        for (const quote of this.quotes) {
                            if (quote['isSelected']) {
                                productsToDelete.push(quote);
                                arr.push(this.quoteService.delete(quote));
                            }
                        }
                        await Promise.all(arr);
                        for (const product of productsToDelete) {
                            this.analyticsService.logEvent('quote-delete-success');
                            let i = this.quotes.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.quotes.splice(i, 1);
                            }
                            i = this.originalQuotes.findIndex(item => item.id === product.id);
                            if (i >= 0) {
                                this.originalQuotes.splice(i, 1);
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
        for (const quote of this.quotes) {
            quote['isSelected'] = false;
        }
        for (let i = this.start; i < this.end; i++) {
            const quote = this.quotes[i];
            quote['isSelected'] = this.isSelectAll;
        }
    }

    async dismiss() {
        if (this.callback) {
            this.callback(null);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss();
    }

    async ok(): Promise<void> {
        this.analyticsService.logEvent('quote-selector-ok');
        if (this.callback) {
            this.callback(this.selectedProducts);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.selectedProducts);
    }

    async showOptions(product) {
        this.analyticsService.logEvent('quote-selector-show-options');
        const callback = (data) => {
            if (data) {
                product.options = data.options;
                product.attributes = data.attributes;
                if (product.count <= 0) {
                    product.count = 1;
                    const isExists = this.selectedProducts.find(item => product.id === item.id);
                    if (!isExists) {
                        this.selectedProducts.push(product);
                    }
                }
                this.reCalc(product);
            }
        };
        await this.navCtrl.push('/order/option-selector', {
            callback,
            mainProduct: JSON.parse(JSON.stringify(product))
        });
    }

    async showTypes(product) {
        this.analyticsService.logEvent('quote-selector-show-types');
        const callback = (data) => {
            if (data) {
                product.types = data.types;
                product.typeOptions = this.getTypeOptions(data.types);
                product.typeAttributes = this.getTypeAttributesString(product);
                product.initPrice = data.initPrice;
                product.price = data.price ? data.price : product.initPrice;
                if (product.count <= 0) {
                    product.count = 1;
                    const isExists = this.selectedProducts.find(item => product.id === item.id);
                    if (!isExists) {
                        this.selectedProducts.push(product);
                    }
                }
                this.reCalc(product);
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

    showOthers(product) {
        product.showOthers = !product.showOthers;
    }

    getTypeAttributesString(product) {
        return Helper.getTypeAttributesString(product);
    }

    getTypeOptions(types): any[] {
        return Helper.getTypeOptions(types);
    }

    reCalc(product: any): void {
        const netTotal = product.count * product.price;
        product.total = netTotal;
        if (product.options && product.options.length) {
            let netValue = 0;
            for (const item of product.options) {
                netValue += item.total * 1;
            }
            product.total = (product.price + netValue) * product.count;
        }
        const discount = product.discount ? product.discount : 0;
        product.total = netTotal - discount;
    }

    async expand(orderItem: any): Promise<void> {
        const isExpand = !orderItem.isExpand;
        for (const item of this.selectedProducts) {
            item.isExpand = false;
        }
        orderItem.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('quote-selector-expand');
        }
    }

    async increase(item) {
        this.analyticsService.logEvent('quote-selector-increase');
        item.count++;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        this.reCalc(item);
    }

    async decrease(item) {
        if (item && item.count === 0) {
            return;
        }
        this.analyticsService.logEvent('quote-selector-decrease');
        item.count--;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        this.reCalc(item);
    }

    changeCount(product) {
        if (product.discountPercent) {
            product.discount = (product.price * product.count) * product.discountPercent / 100;
        }
        this.reCalc(product);
    }

    async removeProduct(item: any): Promise<void> {
        const idx = this.selectedProducts.findIndex(i => i.productId === item.productId && i.unit === item.unit);
        if (idx >= 0) {
            this.selectedProducts.splice(idx, 1);
        }
        this.analyticsService.logEvent('quote-selector-remove-item');
    }
}
