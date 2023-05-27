import { Component, ViewChild } from '@angular/core';
import { AlertController, IonSearchbar, ModalController } from '@ionic/angular';
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
import { StoreService } from '../../providers/store.service';

@Component({
    selector: 'note-product-selector.component',
    templateUrl: 'note-product-selector.component.html'
})
export class NoteProductSelectorComponent {
    @ViewChild('barcodeInput', { static: false }) barcodeInput: IonSearchbar;
    params: any;
    callback: any;
    contactId: any;
    staffId: any;
    selectedProducts: any[] = [];
    originalProducts: any[] = [];
    products: any[] = [];
    originalMaterials: any[] = [];
    materials: any[] = [];
    searchKey = '';
    tab = 'all';
    currency: string;
    start = 0;
    end = 19;
    pageSize = 20;
    currentPage = 0;
    startMaterial = 0;
    endMaterial = 19;
    pageSizeMaterial = 20;
    currentPageMaterial = 0;
    outStock = false;
    listOption = 'all';
    listOptionMaterials = 'all';
    customerPrices = [];
    collaboratorPrices = [];
    staffPrices = [];
    checkProduct = 0;
    currentPlan: any = null;
    isOnTrial;
    store;
    checkStore;
    selectedStaff;
    canViewProductCostPrice;
    canUpdateProductCostPrice;

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
        private modalCtrl: ModalController) {
        this.navCtrl.removeEventListener('reloadNoteProductSelector', this.reloadProducts);
        this.navCtrl.addEventListener('reloadNoteProductSelector', this.reloadProducts);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('note-product-selector');
    }

    tabChanged() {
        this.barcodeFocus();
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
        this.canViewProductCostPrice = !this.staffService.selectedStaff
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canViewProductCostPrice;
        this.canUpdateProductCostPrice = !this.staffService.selectedStaff
            || this.staffService.selectedStaff.hasFullAccess
            || this.staffService.selectedStaff.canUpdateProductCostPrice;
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
        if (this.params && this.params.staffId) {
            this.staffId = this.params.staffId;
        }
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        this.outStock = await this.userService.getAttr('out-stock');

        this.staffPrices = await this.getProductsWithStaffPrice();
        this.customerPrices = await this.getProductsWithCustomerPrice();
        this.collaboratorPrices = await this.getProductsWithCollaboratorPrice();
        this.selectedStaff = this.staffService.selectedStaff;
        this.store = await this.storeService.getCurrentStore();
        this.checkStore = this.store
            ? this.translateService.instant('store.check-store', { shop: this.store.name })
            : null;
        const storeId = this.store ? this.store.id : 0;
        const p = this.listOption === 'all'
            ? this.productService.getProducts(storeId, 0)
            : this.listOption === 'expiry'
                ? this.productService.getProductsExpiry(storeId, 0)
                : this.listOption === 'quantity'
                    ? this.productService.getProductsQuantity(storeId, 0)
                    : Promise.resolve(this.customerPrices);

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
                        productCloned.costPrice = unit.costPrice ? unit.costPrice : unit.price;
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
                    const staffPrices = this.staffPrices && this.staffPrices.length
                        ? this.staffPrices.filter(s => s.id === product.id)
                        : [];
                    const staffPrice = staffPrices && staffPrices.length ? staffPrices[0] : null;
                    const customerPrices = this.customerPrices && this.customerPrices.length
                        ? this.customerPrices.filter(c => c.id === product.id)
                        : [];
                    const customerPrice = customerPrices && customerPrices.length ? customerPrices[0] : null;
                    const collaboratorPrices = this.collaboratorPrices && this.collaboratorPrices.length
                        ? this.collaboratorPrices.filter(c => c && product && c.id === product.id)
                        : [];
                    const collaboratorPrice = collaboratorPrices && collaboratorPrices.length ? collaboratorPrices[0] : null;
                    product.amount = 0;
                    product.discount = 0;
                    product.discountPercent = 0;
                    product.discountType = 0;
                    product.actualQuantity = !this.store
                        ? product.count
                        : (product.storeQuantity ? product.storeQuantity : 0);
                    product.quantity = 0;
                    product.isStaffPrice = false;
                    product.isCustomerPrice = false;
                    product.isCollaboratorPrice = false;
                    if (customerPrice && customerPrice.costPrice) {
                        product.costPrice = customerPrice.costPrice;
                        product.isCustomerPrice = true;
                    } else if (staffPrice && staffPrice.costPrice) {
                        product.costPrice = staffPrice.costPrice;
                        product.isStaffPrice = true;
                    } else if (collaboratorPrice && collaboratorPrice.costPrice) {
                        product.costPrice = collaboratorPrice.costPrice;
                        product.isCollaboratorPrice = true;
                    } else if (!this.canViewProductCostPrice) {
                        product.costPrice = null;
                    } else if (!this.canUpdateProductCostPrice) {
                        product.costPrice = product.costPrice;
                    }
                }
            }
            this.originalProducts = productsPopulated;
            this.products = productsPopulated;
            await loading.dismiss();
            this.barcodeFocus();
        });

        const p2 = this.listOptionMaterials === 'all'
            ? this.productService.getProducts(storeId, true)
            : this.listOptionMaterials === 'expiry'
                ? this.productService.getProductsExpiry(storeId, true)
                : this.listOptionMaterials === 'quantity'
                    ? this.productService.getProductsQuantity(storeId, true)
                    : Promise.resolve(this.customerPrices);

        p2.then(async (products) => {
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
                    const staffPrices = this.staffPrices && this.staffPrices.length
                        ? this.staffPrices.filter(s => s.id === product.id)
                        : [];
                    const staffPrice = staffPrices && staffPrices.length ? staffPrices[0] : null;
                    const customerPrices = this.customerPrices && this.customerPrices.length
                        ? this.customerPrices.filter(c => c.id === product.id)
                        : [];
                    const customerPrice = customerPrices && customerPrices.length ? customerPrices[0] : null;
                    const collaboratorPrices = this.collaboratorPrices && this.collaboratorPrices.length
                        ? this.collaboratorPrices.filter(c => c && product && c.id === product.id)
                        : [];
                    const collaboratorPrice = collaboratorPrices && collaboratorPrices.length ? collaboratorPrices[0] : null;
                    product.amount = 0;
                    product.discount = 0;
                    product.discountPercent = 0;
                    product.discountType = 0;
                    product.actualQuantity = !this.store
                        ? product.count
                        : (product.storeQuantity ? product.storeQuantity : 0);
                    product.quantity = 0;
                    product.isStaffPrice = false;
                    product.isCustomerPrice = false;
                    product.isCollaboratorPrice = false;
                    if (customerPrice && customerPrice.costPrice) {
                        product.costPrice = customerPrice.costPrice;
                        product.isCustomerPrice = true;
                    } else if (staffPrice && staffPrice.costPrice) {
                        product.costPrice = staffPrice.costPrice;
                        product.isStaffPrice = true;
                    } else if (collaboratorPrice && collaboratorPrice.costPrice) {
                        product.costPrice = collaboratorPrice.costPrice;
                        product.isCollaboratorPrice = true;
                    } else if (!this.canViewProductCostPrice) {
                        product.costPrice = null;
                    } else if (!this.canUpdateProductCostPrice) {
                        product.costPrice = product.costPrice;
                    }
                }
            }
            this.originalMaterials = productsPopulated;
            this.materials = productsPopulated;
            await loading.dismiss();
            this.barcodeFocus();
        });
    }

    async openProductDiscountPercent(item: any) {
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
                            item.discount = (item.costPrice * item.quantity) * percent / 100;
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

    barcodeFocus(): void {
        if (!this.navCtrl.isNotCordova()) {
            return;
        }
        if (this.tab !== 'all') {
            return;
        }
        setTimeout(() => {
            if (typeof this.barcodeInput !== 'undefined') {
                this.barcodeInput.setFocus();
            }
        }, 600);
    }

    reCalc(product: any): void {
        const netTotal = product.quantity * product.costPrice;
        const discount = !product.discountType
            ? (!product.discountPercent
                ? product.discount * 1
                : netTotal * product.discountPercent / 100
            )
            : (netTotal * product.discount / 100);
        product.discount = discount;
        product.amount = netTotal - discount;
        if (product.unitPriceForeign && product.quantity) {
            product.amountForeign = product.quantity * product.unitPriceForeign;
        }
    }

    toFixQuantity(count: any) {
        return Helper.toFixQuantity(count);
    }

    async increase(item) {
        const isExists = this.selectedProducts.find(product => product.id === item.id && product.unit === item.unit);
        if (!isExists) {
            this.selectedProducts.push(item);
        }
        item.quantity++;
        if (item.quantity >= 2) {
            this.analyticsService.logEvent('note-product-selector-increase-2');
        }
        this.reCalc(item);
        this.barcodeFocus();
    }


    async decrease(item) {
        if (!item || !item.quantity || item.quantity <= 0) {
            return;
        }

        this.analyticsService.logEvent('note-product-selector-decrease');
        item.quantity--;
        if (item.quantity === 0) {
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
        this.barcodeFocus();
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
        this.barcodeFocus();
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

    async showTypes(product) {
        this.analyticsService.logEvent('note-product-selector-show-types');
        const callback = (data) => {
            if (data) {
                product.types = data.types;
                product.typeOptions = this.getTypeOptions(data.types);
                product.typeAttributes = this.getTypeAttributesString(product);
                product.initPrice = data.initPrice;
                product.costPrice = data.costPrice ? data.costPrice : product.initPrice;
                if (product.quantity <= 0) {
                    product.quantity = 1;
                    const isExists = this.selectedProducts.find(item => product.id === item.id);
                    if (!isExists) {
                        this.selectedProducts.push(product);
                    }
                }
                this.reCalc(product);
            }
        };
        const mainProduct = JSON.parse(JSON.stringify(product));
        mainProduct.costPrice = product.initPrice ? product.initPrice : product.costPrice;
        mainProduct.changedPrice = 0;
        await this.navCtrl.push('/product/type-selector', {
            callback,
            mainProduct
        });
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

    get isShowPagingMaterials() {
        if (this.materials && this.materials.length > this.pageSize) {
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

    previousPageMaterials() {
        if (this.currentPageMaterial <= 0) {
            this.currentPageMaterial = 0;
            return;
        }
        this.currentPageMaterial--;
        this.startMaterial = this.currentPageMaterial * this.pageSizeMaterial;
        this.endMaterial = this.startMaterial + this.pageSizeMaterial - 1;
    }

    getTypeOptions(types): any[] {
        return Helper.getTypeOptions(types);
    }

    nextPage() {
        if ((this.currentPage + 1) * this.pageSize >= this.products.length) {
            return;
        }
        this.currentPage++;
        this.start = this.currentPage * this.pageSize;
        this.end = this.start + this.pageSize - 1;
    }

    nextPageMaterials() {
        if ((this.currentPageMaterial + 1) * this.pageSizeMaterial >= this.materials.length) {
            return;
        }
        this.currentPageMaterial++;
        this.startMaterial = this.currentPageMaterial * this.pageSizeMaterial;
        this.endMaterial = this.startMaterial + this.pageSizeMaterial - 1;
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

    changeListOptionMaterials() {
        this.startMaterial = 0;
        this.endMaterial = 19;
        this.currentPageMaterial = 0;
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
}
