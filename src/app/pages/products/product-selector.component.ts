// tslint:disable:use-lifecycle-interface
import { Component, ViewChild } from '@angular/core';
import { AlertController, IonContent, IonSearchbar, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { ProductService } from '../../providers/product.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { IProduct } from '../../models/product.interface';
import { ContactService } from '../../providers/contact.service';
import { PlanService } from '../../providers/plan.service';
import { StoreService } from '../../providers/store.service';
import { StorageService } from '../../providers/storage.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'product-selector',
    templateUrl: 'product-selector.component.html'
})
export class ProductSelectorComponent {
    @ViewChild('barcodeInput', { static: false }) barcodeInput: IonSearchbar;
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any;
    callback: any;
    contactId: any;
    staffId: any;
    selectedProducts: any[] = [];
    hotProducts: any[] = [];
    products: any[] = [];
    originalProducts: any[] = [];
    isMaterial = false;
    searchKey = '';
    tab = 'all';
    currency: string;
    start = 0;
    end = 19;
    pageSize = 20;
    currentPage = 0;
    outStock = false;
    listOption = 'all';
    customerPrices = [];
    collaboratorPrices = [];
    staffPrices = [];
    checkProduct = 0;
    currentPlan: any = null;
    isOnTrial;
    store;
    checkStore;
    selectedStaff;
    categorySelected;
    blockViewingQuantity = false;
    sortOrder = 'asc';

    constructor(public navCtrl: RouteHelperService,
        private userService: UserService,
        public staffService: StaffService,
        public translateService: TranslateService,
        private productService: ProductService,
        private contactService: ContactService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController,
        private planService: PlanService,
        private storeService: StoreService,
        private storageService: StorageService,
        private modalCtrl: ModalController) {
        this.navCtrl.removeEventListener('reloadProductSelector', this.reloadProducts);
        this.navCtrl.addEventListener('reloadProductSelector', this.reloadProducts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-selector');
    }

    async tabChanged() {
        if (this.tab == 'hot' || this.tab == 'all') {
            await this.storageService.set('product-selector-tab', this.tab);
        }
    }

    async barcodeChanged(): Promise<void> {
        if (!this.searchKey || this.searchKey.length < 5) {
            return;
        }
        this.analyticsService.logEvent('product-selector-barcode-entered');
        this.productService.searchByBarcode(this.searchKey).then((product) => {
            if (!product) {
                return;
            }
            this.analyticsService.logEvent('product-selector-barcode-entered-ok');
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
                customerPrice.product.price = customerPrice.price;
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
                price.product.price = price.price;
            }
        }
        return prices.map(p => p.product);
    }

    async getProductsWithCollaboratorPrice(): Promise<IProduct[]> {
        if (!this.staffService.isStaff() && !this.staffId) {
            return null;
        }
        const prices = await this.contactService.getCollaboratorPrices();
        if (!prices || !prices.length) {
            return [];
        }
        for (const price of prices) {
            if (price.product) {
                price.product.price = price.price;
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
        if (this.params && this.params.contactId) {
            this.contactId = this.params.contactId;
        }
        if (this.params && this.params.categorySelected) {
            this.categorySelected = this.params.categorySelected;
        }
        if (this.params && this.params.staffId) {
            this.staffId = this.params.staffId;
        }
        this.isMaterial = this.params && this.params.isMaterial;
        const loading = await this.navCtrl.loading(30000);
        this.currency = await this.userService.getAttr('current-currency');
        this.outStock = await this.userService.getAttr('out-stock');

        this.staffPrices = await this.getProductsWithStaffPrice();
        this.customerPrices = await this.getProductsWithCustomerPrice();
        this.collaboratorPrices = await this.getProductsWithCollaboratorPrice();
        this.selectedStaff = this.staffService.selectedStaff;
        this.blockViewingQuantity = this.selectedStaff && this.selectedStaff.blockViewingQuantity;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        const storeId = this.store ? this.store.id : 0;
        const p = this.listOption === 'all'
            ? this.productService.getProducts(storeId, this.categorySelected ? this.categorySelected.id : 0, this.isMaterial)
            : this.listOption === 'expiry'
                ? this.productService.getProductsExpiry(storeId, this.categorySelected ? this.categorySelected.id : 0, this.isMaterial)
                : this.listOption === 'quantity'
                    ? this.productService.getProductsQuantity(storeId, this.categorySelected ? this.categorySelected.id : 0, this.isMaterial)
                    : Promise.resolve(this.customerPrices);

        p.then(async (products) => {
            let ordered = _.orderBy(products, ['title'], [this.sortOrder]);
            const arr = [];
            const arrAll = [];
            const arrHot = [];
            for (const product of ordered) {
                product.units = product.unitsJson ? JSON.parse(product.unitsJson) : [];
                product.materials = product.materialsJson ? JSON.parse(product.materialsJson) : [];
                let hasDefaultUnit = false;
                if (product.units && product.units.length) {
                    for (const unit of product.units) {
                        if (unit.isDefault) {
                            hasDefaultUnit = true;
                            break;
                        }
                    }
                }
                let mainProduct = !hasDefaultUnit ? product : null;
                const allUnitProducts = [];
                allUnitProducts.push(product);
                if (product.units && product.units.length) {
                    for (const unit of product.units) {
                        const productCloned = JSON.parse(JSON.stringify(product));
                        productCloned.unit = unit.unit;
                        productCloned.basicUnit = product.unit;
                        productCloned.unitExchange = unit.exchange;
                        productCloned.price = unit.price;
                        productCloned.costPrice = unit.costPrice ? unit.costPrice : unit.price;
                        productCloned.count = Math.floor(product.count / unit.exchange);
                        if (unit.isDefault) {
                            mainProduct = productCloned;
                        }
                        allUnitProducts.push(productCloned);
                    }
                } else {
                    product.unitsJson = null;
                }
                product.units = null;
                if (!mainProduct) {
                    mainProduct = product;
                }
                mainProduct.others = [];
                for (const p of allUnitProducts) {
                    if (p.unit !== mainProduct.unit) {
                        mainProduct.others.push(p);
                        arrAll.push(p);
                    }
                }
                arr.push(mainProduct);
                arrAll.push(mainProduct);
                if (mainProduct.isHotProduct) {
                    arrHot.push(mainProduct);
                }
            }
            if (arrAll && arrAll.length) {
                for (const product of arrAll) {
                    product.shopPrice = product.price;
                    const staffPrices = this.staffPrices && this.staffPrices.length
                        ? this.staffPrices.filter(s => s.id === product.id)
                        : [];
                    const staffPrice = staffPrices && staffPrices.length ? staffPrices[0] : null;
                    const customerPrices = this.customerPrices && this.customerPrices.length
                        ? this.customerPrices.filter(c => c.id === product.id)
                        : [];
                    const customerPrice = customerPrices && customerPrices.length ? customerPrices[0] : null;
                    const collaboratorPrices = this.collaboratorPrices && this.collaboratorPrices.length
                        ? this.collaboratorPrices.filter(c => c && c.id === product.id)
                        : [];
                    const collaboratorPrice = collaboratorPrices && collaboratorPrices.length ? collaboratorPrices[0] : null;
                    product.total = 0;
                    product.quantity = !this.store
                        ? product.count
                        : (product.storeQuantity ? product.storeQuantity : 0);
                    product.count = 0;
                    product.isStaffPrice = false;
                    product.isCustomerPrice = false;
                    product.isCollaboratorPrice = false;
                    if (customerPrice) {
                        product.basePrice = product.price;
                        product.price = customerPrice.price;
                        product.isCustomerPrice = true;
                    } else if (staffPrice) {
                        product.basePrice = product.price;
                        product.price = staffPrice.price;
                        product.isStaffPrice = true;
                    } else if (collaboratorPrice) {
                        product.basePrice = product.price;
                        product.price = collaboratorPrice.price;
                        product.isCollaboratorPrice = true;
                    }
                }
            }
            ordered = arr;
            this.originalProducts = ordered;
            this.products = ordered;
            this.hotProducts = arrHot;
            const previousTab = await this.storageService.get('product-selector-tab');
            this.tab = previousTab === 'hot' && this.hotProducts && this.hotProducts.length ? 'hot' : 'all';
            await loading.dismiss();
        });
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

    async changeCount(item) {
        const materials = item.materialsJson ? JSON.parse(item.materialsJson) : [];
        if (this.outStock && ((item.quantity - item.count) <= 0) && !item.isService && !item.isCombo && !(materials && materials.length)) {
            this.analyticsService.logEvent('product-selector-outstock-alert');
            alert(this.translateService.instant('order-add.outstock-alert'));
            return;
        }
        const isExists = this.selectedProducts.find(product => product.id === item.id && product.unit === item.unit);
        if (!isExists) {
            if (item.expiredAt) {
                const date = moment(item.expiredAt).utc().format(DateTimeService.getDateDbFormat());
                const currentDate = moment(new Date()).format(DateTimeService.getDateDbFormat());
                if (date < currentDate) {
                    const confirm = await this.alertCtrl.create({
                        header: this.translateService.instant('common.confirm'),
                        message: this.translateService.instant('product.expired-alert',
                            { expiryDate: DateTimeService.toDbDateOnlyString(item.expiredAt) }
                        ),
                        buttons: [
                            {
                                text: this.translateService.instant('common.cancel'),
                                handler: () => {
                                }
                            },
                            {
                                text: this.translateService.instant('common.agree'),
                                handler: () => {
                                    this.selectedProducts.push(item);
                                    item.count++;
                                    if (item.discountPercent) {
                                        item.discount = (item.price * item.count) * item.discountPercent / 100;
                                    }
                                    if (item.count >= 2) {
                                        this.analyticsService.logEvent('product-selector-increase-2');
                                    }
                                    this.reCalc(item);
                                }
                            },
                        ]
                    });
                    await confirm.present();
                    return;
                }
            }
            this.selectedProducts.push(item);
        }
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        if (item.count >= 2) {
            this.analyticsService.logEvent('product-selector-increase-2');
        }
        this.reCalc(item);
    }

    async increase(item) {
        const materials = item.materialsJson ? JSON.parse(item.materialsJson) : [];
        if (this.outStock && ((item.quantity - item.count) <= 0) && !item.isService && !item.isCombo && !(materials && materials.length)) {
            this.analyticsService.logEvent('product-selector-outstock-alert');
            alert(this.translateService.instant('order-add.outstock-alert'));
            return;
        }
        const isExists = this.selectedProducts.find(product => product.id === item.id && product.unit === item.unit);
        if (!isExists) {
            if (item.expiredAt) {
                const date = moment(item.expiredAt).utc().format(DateTimeService.getDateDbFormat());
                const currentDate = moment(new Date()).format(DateTimeService.getDateDbFormat());
                if (date < currentDate) {
                    const confirm = await this.alertCtrl.create({
                        header: this.translateService.instant('common.confirm'),
                        message: this.translateService.instant('product.expired-alert',
                            { expiryDate: DateTimeService.toDbDateOnlyString(item.expiredAt) }
                        ),
                        buttons: [
                            {
                                text: this.translateService.instant('common.cancel'),
                                handler: () => {
                                }
                            },
                            {
                                text: this.translateService.instant('common.agree'),
                                handler: () => {
                                    this.selectedProducts.push(item);
                                    item.count++;
                                    if (item.discountPercent) {
                                        item.discount = (item.price * item.count) * item.discountPercent / 100;
                                    }
                                    if (item.count >= 2) {
                                        this.analyticsService.logEvent('product-selector-increase-2');
                                    }
                                    this.reCalc(item);
                                }
                            },
                        ]
                    });
                    await confirm.present();
                    return;
                }
            }
            this.selectedProducts.push(item);
        }
        item.count++;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        if (item.count >= 2) {
            this.analyticsService.logEvent('product-selector-increase-2');
        }
        this.reCalc(item);
    }

    async decrease(item) {
        if (item && item.count === 0) {
            return;
        }

        this.analyticsService.logEvent('product-selector-decrease');
        item.count--;
        if (item.discountPercent) {
            item.discount = (item.price * item.count) * item.discountPercent / 100;
        }
        if (item.count === 0) {
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

    ngOnInit(): void {
        this.reloadProducts();
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('product-selector-search');
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
        this.analyticsService.logEvent('product-selector-clear-search');
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
        this.analyticsService.logEvent('product-selector-ok');
        if (this.callback) {
            this.callback(this.selectedProducts);
            await this.navCtrl.back();
            return;
        }
        this.modalCtrl.dismiss(this.selectedProducts);
    }

    async showOptions(product) {
        this.analyticsService.logEvent('product-selector-show-options');
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
        this.analyticsService.logEvent('product-selector-show-types');
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
        this.content.scrollToTop();
    }

    getTypeOptions(types): any[] {
        return Helper.getTypeOptions(types);
    }

    changeSortOrder() {
      this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
      this.reloadProducts();
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
        this.content.scrollToTop();
    }

    async expand(product: any): Promise<void> {
        const isExpand = !product.isExpand;
        for (const item of this.products) {
            item.isExpand = false;
        }
        product.isExpand = isExpand;
        if (isExpand) {
            this.analyticsService.logEvent('product-selector-expand');
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

    async exitStore() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('store.exit-store-alert', { shop: this.store.name }),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        await this.storeService.exitStore();
                        await this.reloadProducts();
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

    async showSearchCategory() {
      this.analyticsService.logEvent('product-filter-by-category');
      const callback = (data) => {
        const item = data;
        if (item) {
          this.categorySelected = item;
          this.reloadProducts();
        }
      };
      this.navCtrl.push('/trade-category', { callback, searchMode: true });
    }

    removeCategory() {
      this.categorySelected = null;
      this.reloadProducts();
    }
}
