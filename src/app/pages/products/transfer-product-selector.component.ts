import { Component, ViewChild } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { TranslateService } from '@ngx-translate/core';
import { IProduct } from '../../models/product.interface';
import { ContactService } from '../../providers/contact.service';
import { PlanService } from '../../providers/plan.service';

@Component({
    selector: 'transfer-product-selector',
    templateUrl: 'transfer-product-selector.component.html'
})
export class TransferProductSelectorComponent {
    @ViewChild('barcodeInput', { static: false }) barcodeInput: IonSearchbar;
    params: any;
    callback: any;
    contactId: any;
    staffId: any;
    products: any[] = [];
    selectedProducts: any[] = [];
    originalProducts: any[] = [];
    searchKey = '';
    tab = 'all';
    currency: string;
    start = 0;
    end = 19;
    pageSize = 20;
    currentPage = 0;
    listOption = 'all';
    checkProduct = 0;
    currentPlan: any = null;
    isOnTrial;
    exportStore;
    selectedStaff;

    constructor(public navCtrl: RouteHelperService,
                private userService: UserService,
                public staffService: StaffService,
                public translateService: TranslateService,
                private productService: ProductService,
                private contactService: ContactService,
                private analyticsService: AnalyticsService,
                private planService: PlanService,
                private modalCtrl: ModalController) {
        this.navCtrl.removeEventListener('reloadNoteProductSelector', this.reloadProducts);
        this.navCtrl.addEventListener('reloadNoteProductSelector', this.reloadProducts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('note-product-selector');
    }

    tabChanged() {
    }

    async barcodeChanged(): Promise<void> {
        if (!this.searchKey || this.searchKey.length < 5) {
            return;
        }
        this.analyticsService.logEvent('note-product-selector-barcode-entered');
        this.productService.searchByBarcode(this.searchKey).then((product) => {
            if (!product) {
                return;
            }
            this.analyticsService.logEvent('note-product-selector-barcode-entered-ok');
            let products: any[] = this.originalProducts;
            products = products.filter((item) => (item.id === product.id));
            if (products && products.length) {
                for (const item of products) {
                    this.increase(item);
                }
            }
            this.products = products;
        });
    }

    async getProductsWithCustomerPrice(): Promise<IProduct[]> {
        if (!this.contactId) {
            return null;
        }
        const customerPrices = await this.contactService.getCustomerPricesByContact(this.contactId);
        if (!customerPrices || !customerPrices.length) {
            return [];
        }
        for (const customerPrice of customerPrices) {
            if (customerPrice.product) {
                customerPrice.product.costPrice = customerPrice.costPrice;
            }
        }
        return customerPrices.map(p => p.product);
    }

    async getProductsWithStaffPrice(): Promise<IProduct[]> {
        if (!this.staffService.isStaff() && !this.staffId) {
            return null;
        }
        const mainStaffId = this.staffService.isStaff()
            ? this.staffService.selectedStaff.id
            : this.staffId;
        const prices = await this.contactService.getCustomerPricesByStaff(mainStaffId);
        if (!prices || !prices.length) {
            return [];
        }
        for (const price of prices) {
            if (price.product) {
                price.product.costPrice = price.costPrice;
            }
        }
        return prices.map(p => p.product);
    }

    async getProductsWithCollaboratorPrice(): Promise<IProduct[]> {
        if (!this.staffService.isStaff()) {
            return null;
        }
        const prices = await this.contactService.getCollaboratorPrices();
        if (!prices || !prices.length) {
            return [];
        }
        for (const price of prices) {
            if (price.product) {
                price.product.costPrice = price.costPrice;
            }
        }
        return prices.map(p => p.product);
    }

    reloadProducts = async () => {
        this.currentPlan = await this.planService.getCurrentPlan();
        if (!this.currentPlan) {
            this.checkProduct = await this.planService.checkProduct();
            if (this.checkProduct >= 30) {
                this.isOnTrial = await this.planService.isOnTrial(this.currentPlan);
            }
        }
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.callback) {
            this.callback = this.params.callback;
        }
        if (this.params && this.params.exportStore) {
            this.exportStore = this.params.exportStore;
        }
        if (this.params && this.params.contactId) {
            this.contactId = this.params.contactId;
        }
        if (this.params && this.params.staffId) {
            this.staffId = this.params.staffId;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');

        this.selectedStaff = this.staffService.selectedStaff;
        const storeId = this.exportStore && !this.exportStore.isMainShop ? this.exportStore.id : 0;
        const p = this.listOption === 'all'
            ? this.productService.getProducts(storeId, 0)
            : this.listOption === 'expiry'
                ? this.productService.getProductsExpiry(storeId, 0)
                : this.listOption === 'quantity'
                    ? this.productService.getProductsQuantity(storeId, 0)
                    : Promise.resolve(null);

        p.then(async (products) => {
            let productsPopulated = JSON.parse(JSON.stringify(products));
            const arr = [];
            for (const product of productsPopulated) {
                arr.push(product);
                product.units = product.unitsJson ? JSON.parse(product.unitsJson) : [];
                if (product.units && product.units.length) {
                    for (const unit of product.units) {
                        const productCloned = JSON.parse(JSON.stringify(product));
                        productCloned.unit = unit.unit;
                        productCloned.basicUnit = product.unit;
                        productCloned.unitExchange = unit.exchange;
                        productCloned.price = unit.price;
                        productCloned.count = Math.floor(product.count / unit.exchange);
                        arr.push(productCloned);
                    }
                } else {
                    product.unitsJson = null;
                }
                product.units = null;
            }
            productsPopulated = arr;
            if (productsPopulated && productsPopulated.length) {
                for (const product of productsPopulated) {
                    product.amount = 0;
                    product.actualQuantity = !this.exportStore || this.exportStore.isMainShop
                        ? product.count
                        : (product.storeQuantity ? product.storeQuantity : 0);
                    product.actualImport = 0;
                    product.actualExport = 0;
                    product.unitPrice = product.price ? product.price : product.costPrice;
                }
            }
            this.originalProducts = productsPopulated;
            this.products = productsPopulated;
            await loading.dismiss();
        });
    }

    reCalc(product: any): void {
        product.amount = product.actualExport * product.unitPrice;
    }

    toFixQuantity(count: any) {
        return Helper.toFixQuantity(count);
    }

    async increase(item) {
        if (((item.actualQuantity - item.actualExport) <= 0) && !item.isService && !item.isCombo) {
            this.analyticsService.logEvent('transfer-product-selector-outstock-alert');
            alert(this.translateService.instant('transfer-note-add.outstock-alert'));
            return;
        }
        const isExists = this.selectedProducts.find(product => product.id === item.id && product.unit === item.unit);
        if (!isExists) {
            this.selectedProducts.push(item);
        }
        item.actualImport++;
        item.actualExport++;
        this.reCalc(item);
    }

    async decrease(item) {
        if (!item) {
            return;
        }

        if (item.actualImport && item.actualImport > 0) {
            item.actualImport--;
        }
        if (item.actualExport && item.actualExport > 0) {
            item.actualExport--;
        }

        this.analyticsService.logEvent('transfer-product-selector-decrease');
        if (item.actualExport === 0) {
            const foundIndex = this.selectedProducts.findIndex(product => product.id === item.id && product.unit === item.unit);
            if (foundIndex >= 0) {
                this.selectedProducts.splice(foundIndex, 1);
            }
            if ((!this.selectedProducts || !this.selectedProducts.length)
                && (this.tab !== 'all')) {
                this.tab = 'all';
                this.tabChanged();
            }
        }
        this.reCalc(item);
    }

    // tslint:disable-next-line:use-lifecycle-interface
    ngOnInit(): void {
        this.reloadProducts();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('note-product-selector-search');
        let products: any[] = this.originalProducts;
        if (this.searchKey !== null && this.searchKey !== '') {
            this.start = 0;
            this.end = 19;
            this.currentPage = 0;
            const searchKey = this.searchKey.toLowerCase();
            products = products.filter((item) => (item.title && item.title.toLowerCase().indexOf(searchKey) !== -1)
                    || (item.code && item.code.toLowerCase().indexOf(searchKey) !== -1));
        }
        this.products = products;
    }

    async clearSearch() {
        this.start = 0;
        this.end = 19;
        this.currentPage = 0;
        this.analyticsService.logEvent('note-product-selector-clear-search');
        this.searchKey = null;
        this.products = this.originalProducts;
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
        this.analyticsService.logEvent('note-product-selector-ok');
        if (this.callback) {
            this.callback(this.selectedProducts);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.selectedProducts);
    }

    productName(code: string, title: string): string {
        const maxLength = 100;
        let name = Helper.productName(code, title);
        if (!name || name.length <= maxLength) {
            return name;
        }
        name = name.substr(0, maxLength);
        name = name.substr(0, Math.min(name.length, name.lastIndexOf(' '))) + '...';
        return name;
    }

    get isShowPaging() {
        if (this.products && this.products.length > this.pageSize) {
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
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
    }

    async expand(product: any): Promise<void> {
        const isExpand = !product.isExpand;
        for (const item of this.products) {
            item.isExpand = false;
        }
        product.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('note-product-selector-expand');
        }
    }

    changeListOption() {
        this.start = 0;
        this.end = 19;
        this.currentPage = 0;
        this.reloadProducts();
    }

    add(): void {
        if (!this.currentPlan && this.checkProduct >= 30 && !this.isOnTrial) {
            this.analyticsService.logEvent('check-product-alert');
            alert(this.translateService.instant('product.check-product-alert', { total: this.checkProduct }));
            return;
        }
        this.navCtrl.push('/product/quick-add', { fromSearch: true });
    }
}
